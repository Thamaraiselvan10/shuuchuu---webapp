import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { diaryService } from '../services/diaryService';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Button from '../components/Button';

const Diary = () => {
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', mood: 'neutral' });
  const { showToast } = useToast();

  const contentRef = useRef(null);

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (contentRef.current) {
        contentRef.current.focus();
      }
      
    }
  };

  const handleContentKeyDown = (e) => {
    // Allow Ctrl+Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    // Check for unsaved draft
    const draft = localStorage.getItem('diary_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title || parsed.content) {
          setEditForm(parsed);
          setIsEditing(true);
          showToast('Restored unsaved draft', 'info');
        }
      } catch (e) {
        console.error("Error parsing diary draft", e);
      }
    }

    if (searchQuery) {
      handleSearch();
    } else {
      loadEntries();
    }
  }, [searchQuery]);

  // Auto-save effect
  useEffect(() => {
    if (isEditing) {
      localStorage.setItem('diary_draft', JSON.stringify(editForm));
    }
  }, [editForm, isEditing]);

  const loadEntries = async () => {
    try {
      const result = await diaryService.getAll();
      setEntries(result);
    } catch (err) {
      console.error('Failed to load diary entries', err);
      showToast('Failed to load entries', 'error');
    }
  };

  const handleSearch = async () => {
    try {
      const result = await diaryService.search(searchQuery);
      setEntries(result);
    } catch (err) {
      console.error('Failed to search diary', err);
    }
  };

  const handleCreateNew = () => {
    setSelectedEntry(null);
    setEditForm({ title: '', content: '', mood: 'neutral' });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Allow save if either title or content exists
    if (!editForm.content.trim() && !editForm.title.trim()) {
      showToast('Please write something before saving!', 'error');
      return;
    }

    try {
      if (selectedEntry) {
        await diaryService.update(selectedEntry.id, editForm);
        showToast('Memory updated successfully!', 'success');
      } else {
        await diaryService.create(editForm);
        showToast('New memory saved!', 'success');
      }

      setIsEditing(false);
      setSelectedEntry(null);
      localStorage.removeItem('diary_draft'); // Clear draft on save
      loadEntries();
    } catch (error) {
      console.error('Save failed:', error);
      showToast('Failed to save entry', 'error');
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  const handleDelete = (id) => {
    setEntryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await diaryService.delete(entryToDelete);
      if (selectedEntry && selectedEntry.id === entryToDelete) {
        setSelectedEntry(null);
        setIsEditing(false);
      }
      setDeleteModalOpen(false);
      setEntryToDelete(null);
      loadEntries();
    }
  };

  const handleSelectEntry = (entry) => {
    setSelectedEntry(entry);
    setEditForm({
      title: entry.title,
      content: entry.content,
      mood: entry.mood
    });
    setIsEditing(false);
  };

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e) => {
    // Prevent drag if clicking interactive elements
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('.mood-option') || e.target.closest('.entry-item-styled')) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  return (
    <div className="diary-book-container">
      <div
        className="book"
        onMouseDown={handleMouseDown}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        <div className="book-cover">
          <div className="book-spine"></div>
          <div className="page left-page">
            <div className="page-content-wrapper">
              <div className="diary-header">
                <h2>My Journal</h2>
                <button className="new-entry-btn" onClick={handleCreateNew}>+ Write</button>
              </div>

              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="entries-list-styled">
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`entry-item-styled ${selectedEntry?.id === entry.id ? 'active' : ''}`}
                    onClick={() => handleSelectEntry(entry)}
                  >
                    <div className="entry-date-styled">{format(new Date(entry.created_at), 'MMM d')}</div>
                    <div className="entry-info-styled">
                      <div className="entry-title-styled">{entry.title || 'Dear Diary...'}</div>
                      <div className="entry-mood-icon">{getMoodIcon(entry.mood)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="page right-page">
            <div className="page-content-wrapper">
              {isEditing ? (
                <div className="diary-editor">
                  <div className="editor-header">
                    <div className="date-display">{format(new Date(), 'MMMM do, yyyy')}</div>
                    <div className="mood-picker">
                      {['happy', 'neutral', 'sad', 'productive', 'stressed'].map(mood => (
                        <span
                          key={mood}
                          className={`mood-option ${editForm.mood === mood ? 'selected' : ''}`}
                          onClick={() => setEditForm({ ...editForm, mood })}
                          title={mood}
                        >
                          {getMoodIcon(mood)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input
                    className="title-input"
                    placeholder="Title of your memory..."
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                  />
                  <textarea
                    ref={contentRef}
                    className="handwriting-textarea"
                    placeholder="Dear Diary, today was..."
                    value={editForm.content}
                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                    onKeyDown={handleContentKeyDown}
                  />
                  <div className="page-actions">
                    <button className="text-btn cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="text-btn save" onClick={handleSave}>Save Entry</button>
                  </div>
                </div>
              ) : selectedEntry ? (
                <div className="diary-view">
                  <div className="view-header-styled">
                    <div className="date-stamp">{format(new Date(selectedEntry.created_at), 'MMMM do, yyyy')}</div>
                    <div className="mood-stamp">{getMoodIcon(selectedEntry.mood)}</div>
                  </div>
                  <h1 className="handwriting-title">{selectedEntry.title}</h1>
                  <div className="handwriting-content">
                    {selectedEntry.content.split('\n').map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                  <div className="page-actions">
                    <button className="text-btn" onClick={() => setIsEditing(true)}>Edit</button>
                    <button className="text-btn delete" onClick={() => handleDelete(selectedEntry.id)}>Tear Page</button>
                  </div>
                </div>
              ) : (
                <div className="empty-book-state">
                  <div className="ink-blot"></div>
                  <p>Select a memory to read<br />or start a new page.</p>
                  <button className="text-btn" onClick={handleCreateNew} style={{ marginTop: '20px', fontSize: '1.2rem', textDecoration: 'underline' }}>Start Writing</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Entry"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Are you sure you want to delete this memory?</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Button onClick={() => setDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
            <Button onClick={confirmDelete} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
          </div>
        </div>
      </Modal>

      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Indie+Flower&family=Patrick+Hand&display=swap');

                .diary-book-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: calc(100vh - 100px);
                    perspective: 1500px;
                }

                .book {
                    width: 900px;
                    height: 600px;
                    position: relative;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                    border-radius: 10px;
                    background: #fdf6e3; /* Paper color */
                }

                .book-cover {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #fff;
                }

                .book-spine {
                    width: 40px;
                    height: 100%;
                    background: linear-gradient(to right, #d4c5a9, #e6dcc8, #d4c5a9);
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
                    z-index: 10;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                }

                .page {
                    flex: 1;
                    padding: 30px 40px;
                    background: #fdf6e3;
                    position: relative;
                    overflow: hidden;
                }

                .page::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 100%;
                    pointer-events: none;
                    background-image: linear-gradient(#e5e5e5 1px, transparent 1px);
                    background-size: 100% 30px; /* Line height */
                    opacity: 0.5;
                }

                .left-page {
                    border-right: 1px solid rgba(0,0,0,0.05);
                    padding-right: 60px; /* Space for spine */
                }

                .right-page {
                    border-left: 1px solid rgba(0,0,0,0.05);
                    padding-left: 60px; /* Space for spine */
                }

                .page-content-wrapper {
                    position: relative;
                    z-index: 1;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                /* Left Page Styles */
                .diary-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    font-family: 'Patrick Hand', cursive;
                }

                .diary-header h2 {
                    font-size: 2rem;
                    color: #5d4037;
                    margin: 0;
                }

                .new-entry-btn {
                    background: none;
                    border: 2px solid #5d4037;
                    border-radius: 20px;
                    padding: 5px 15px;
                    font-family: 'Patrick Hand', cursive;
                    font-weight: bold;
                    color: #5d4037;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 5;
                }

                .new-entry-btn:hover {
                    background: #5d4037;
                    color: #fdf6e3;
                }

                .search-bar input {
                    width: 100%;
                    padding: 8px;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid #d7ccc8;
                    font-family: 'Patrick Hand', cursive;
                    font-size: 1.2rem;
                    color: #5d4037;
                    outline: none;
                }

                .entries-list-styled {
                    margin-top: 20px;
                    overflow-y: auto;
                    flex: 1;
                }

                .entry-item-styled {
                    display: flex;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px dashed #d7ccc8;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .entry-item-styled:hover {
                    background: rgba(93, 64, 55, 0.05);
                    padding-left: 5px;
                }

                .entry-item-styled.active {
                    background: rgba(93, 64, 55, 0.1);
                    padding-left: 10px;
                    font-weight: bold;
                }

                .entry-date-styled {
                    font-family: 'Patrick Hand', cursive;
                    font-size: 1.1rem;
                    color: #8d6e63;
                    width: 60px;
                }

                .entry-info-styled {
                    flex: 1;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .entry-title-styled {
                    font-family: 'Indie Flower', cursive;
                    font-size: 1.3rem;
                    color: #3e2723;
                }

                /* Right Page Styles */
                .diary-editor {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .handwriting-textarea {
                    width: 100%;
                    flex: 1;
                    background: transparent;
                    border: none;
                    font-family: 'Indie Flower', cursive;
                    font-size: 1.5rem;
                    line-height: 30px; /* Match grid */
                    color: #3e2723;
                    outline: none;
                    resize: none;
                    padding: 0;
                    margin-top: 10px;
                }

                .title-input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid #5d4037;
                    font-family: 'Indie Flower', cursive;
                    font-size: 2rem;
                    color: #3e2723;
                    outline: none;
                    margin-bottom: 10px;
                    flex-shrink: 0;
                }

                .editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px dashed #d7ccc8;
                    padding-bottom: 10px;
                }

                .date-display {
                    font-family: 'Patrick Hand', cursive;
                    font-size: 1.2rem;
                    color: #8d6e63;
                }

                .mood-picker {
                    display: flex;
                    gap: 10px;
                }

                .mood-option {
                    cursor: pointer;
                    font-size: 1.5rem;
                    opacity: 0.5;
                    transition: 0.2s;
                }

                .mood-option.selected {
                    opacity: 1;
                    transform: scale(1.2);
                }

                .page-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    margin-top: 10px;
                }
                .text-btn {
                    background: none;
                    border: none;
                    font-family: 'Patrick Hand', cursive;
                    font-size: 1.1rem;
                    color: #5d4037;
                    cursor: pointer;
                    text-decoration: none;
                    padding: 5px 10px;
                    border-radius: 5px;
                    transition: background 0.2s;
                }
                .text-btn:hover {
                    background: rgba(93, 64, 55, 0.1);
                }

                .text-btn.save {
                    font-weight: bold;
                    color: #2e7d32;
                }

                .text-btn.delete {
                    color: #c62828;
                }
                .text-btn.delete:hover {
                    background: rgba(198, 40, 40, 0.1);
                }

                .diary-view {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .view-header-styled {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #5d4037;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }

                .date-stamp {
                    font-family: 'Patrick Hand', cursive;
                    font-size: 1rem;
                    color: #5d4037;
                    opacity: 0.8;
                }

                .handwriting-title {
                    font-family: 'Indie Flower', cursive;
                    font-size: 2rem;
                    color: #3e2723;
                    margin: 0 0 15px 0;
                    line-height: 1.2;
                }

                .handwriting-content {
                    font-family: 'Indie Flower', cursive;
                    font-size: 1.35rem;
                    line-height: 30px;
                    color: #3e2723;
                    flex: 1;
                    overflow-y: auto;
                    padding-top: 7px; /* Align first line with grid */
                }

                .empty-book-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-family: 'Indie Flower', cursive;
                    font-size: 1.5rem;
                    color: #8d6e63;
                    text-align: center;
                }

                /* Mobile View: Stack pages, no drag */
                @media (max-width: 768px) {
                    .diary-book-container {
                        perspective: none;
                        padding: 16px;
                        height: auto;
                        min-height: calc(100vh - 80px);
                    }

                    .book {
                        width: 100%;
                        height: auto;
                        min-height: 80vh;
                        box-shadow: none;
                        transform: none !important;
                        cursor: default !important;
                    }

                    .book-cover {
                        flex-direction: column;
                    }

                    .book-spine {
                        display: none;
                    }

                    .page {
                        padding: 20px;
                        border: none;
                    }

                    .left-page, .right-page {
                        width: 100%;
                        border: none;
                        padding-right: 20px;
                        padding-left: 20px;
                    }

                    .diary-header {
                        margin-bottom: 12px;
                    }

                    .entries-list-styled {
                        max-height: 300px; /* Limit list height on mobile when stacked */
                    }
                }
            `}</style>
    </div>
  );
};

const getMoodIcon = (mood) => {
  switch (mood) {
    case 'happy': return '😊';
    case 'neutral': return '😐';
    case 'sad': return '😢';
    case 'productive': return '🚀';
    case 'stressed': return '😫';
    default: return '😐';
  }
};

export default Diary;
