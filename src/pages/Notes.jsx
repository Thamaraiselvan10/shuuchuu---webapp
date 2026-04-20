import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { noteService } from '../services/noteService';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import { Pin } from 'lucide-react';

const Notes = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pinnedNotes, setPinnedNotes] = useState(() => {
        const saved = localStorage.getItem('pinned_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const editorRef = useRef(null);
    const titleInputRef = useRef(null);
    const autoSaveTimerRef = useRef(null);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'unsaved' | 'saving' | 'saved'

    // Filter notes by search query
    const filteredNotes = useMemo(() => {
        const filtered = notes.filter(note =>
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
        // Sort: pinned first, then by date
        return filtered.sort((a, b) => {
            const aPinned = pinnedNotes.includes(a.id);
            const bPinned = pinnedNotes.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
    }, [notes, searchQuery, pinnedNotes]);

    const togglePin = (noteId) => {
        setPinnedNotes(prev => {
            const newPinned = prev.includes(noteId)
                ? prev.filter(id => id !== noteId)
                : [...prev, noteId];
            localStorage.setItem('pinned_notes', JSON.stringify(newPinned));
            return newPinned;
        });
    };

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        const data = await noteService.getAll();
        setNotes(data);

        // Check for draft
        const draft = localStorage.getItem('note_draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.title || parsed.content) {
                    setEditTitle(parsed.title);
                    const newNote = { id: null, title: parsed.title, content: parsed.content };
                    setSelectedNote(newNote);
                    setIsEditing(true);
                    // Set timeout to fill editor
                    setTimeout(() => {
                        if (editorRef.current) {
                            editorRef.current.innerHTML = parsed.content;
                            // Add input listener for continued autosave
                        }
                    }, 100);
                }
            } catch (e) { }
        }
    };

    const saveDraft = (title, content) => {
        localStorage.setItem('note_draft', JSON.stringify({ title, content }));
    };

    // Debounced auto-save to database
    const triggerAutoSave = useCallback((title, content) => {
        saveDraft(title, content);
        setSaveStatus('unsaved');

        // Clear any existing debounce timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            if (!title.trim()) return; // Don't save notes without a title

            setSaveStatus('saving');
            try {
                if (selectedNote && selectedNote.id) {
                    // Update existing note
                    await noteService.update(selectedNote.id, { title, content });
                } else {
                    // Create new note, then update selectedNote with the new id
                    const newId = await noteService.create({ title, content });
                    setSelectedNote(prev => ({ ...prev, id: newId }));
                    localStorage.removeItem('note_draft');
                }
                setSaveStatus('saved');
                // Refresh the sidebar list
                const data = await noteService.getAll();
                setNotes(data);

                // Reset status after a brief moment
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                console.error('Auto-save failed:', err);
                setSaveStatus('unsaved');
            }
        }, 1500);
    }, [selectedNote]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);

    const handleCreate = () => {
        const newNote = { id: null, title: '', content: '' };
        setSelectedNote(newNote);
        setEditTitle('');
        setIsEditing(true);
        setSaveStatus('idle');
        if (editorRef.current) editorRef.current.innerHTML = '';
    };

    const handleSelect = (note) => {
        setSelectedNote(note);
        setEditTitle(note.title);
        setIsEditing(true);
        setSaveStatus('idle');
        // Small timeout to allow render
        setTimeout(() => {
            if (editorRef.current) editorRef.current.innerHTML = note.content;
        }, 0);
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (editorRef.current) {
                editorRef.current.focus();
                // Move cursor to end if needed, but simple focus is usually enough for empty/start
            }
        }
    };

    const handleSave = async () => {
        if (!editTitle.trim()) return;

        const content = editorRef.current.innerHTML;

        if (selectedNote.id) {
            await noteService.update(selectedNote.id, { title: editTitle, content });
        } else {
            await noteService.create({ title: editTitle, content });
        }

        setIsEditing(false);
        setSelectedNote(null);
        localStorage.removeItem('note_draft'); // Clear draft
        loadNotes();
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setNoteToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (noteToDelete) {
            await noteService.delete(noteToDelete);
            if (selectedNote && selectedNote.id === noteToDelete) {
                setIsEditing(false);
                setSelectedNote(null);
            }
            setDeleteModalOpen(false);
            setNoteToDelete(null);
            loadNotes();
        }
    };

    const handleExportPDF = () => {
        if (!selectedNote) return;

        // Create an invisible iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // Construct clean HTML with minimal styling
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${selectedNote.title}</title>
                <style>
                    body {
                        font-family: 'Helvetica', 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #000;
                        padding: 40px;
                        margin: 0;
                    }
                    h1 {
                        font-size: 24px;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    h2 { font-size: 20px; margin-top: 20px; }
                    ul, ol { margin-left: 20px; margin-bottom: 15px; }
                    p { margin-bottom: 15px; }
                    blockquote {
                        border-left: 4px solid #ccc;
                        margin: 10px 0;
                        padding-left: 15px;
                        font-style: italic;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <h1>${selectedNote.title}</h1>
                <div class="content">
                    ${selectedNote.content}
                </div>
            </body>
            </html>
        `;

        // Write content to iframe and print
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        // Wait for content (e.g. images) to be "ready" enough, 
        // though strictly we just have text. Small timeout for safety.
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // Remove iframe after printing (give it a moment)
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    const execCmd = (command) => {
        document.execCommand(command, false, null);
    };

    return (
        <div className="notes-container">
            <div className={`notes-sidebar glass-panel ${isEditing ? 'hidden-mobile' : ''}`}>
                <div className="sidebar-header">
                    <h2 style={{ margin: 0 }}>Notes</h2>
                    <Button onClick={handleCreate}>+ New</Button>
                </div>

                {/* Search Bar */}
                <div className="notes-search">
                    <input
                        type="text"
                        placeholder="🔍 Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="notes-list">
                    {filteredNotes.length === 0 ? (
                        <div className="no-notes">{searchQuery ? 'No matching notes' : 'No notes yet'}</div>
                    ) : (
                        filteredNotes.map(note => {
                            const isPinned = pinnedNotes.includes(note.id);
                            const preview = note.content.replace(/<[^>]*>/g, '').substring(0, 60);
                            return (
                                <div
                                    key={note.id}
                                    className={`note-item ${selectedNote?.id === note.id ? 'active' : ''} ${isPinned ? 'pinned' : ''}`}
                                    onClick={() => handleSelect(note)}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                                        className="pin-btn"
                                        title={isPinned ? 'Unpin' : 'Pin to top'}
                                    >
                                        <Pin size={14} fill={isPinned ? "currentColor" : "none"} />
                                    </button>
                                    <div className="note-item-content">
                                        <div className="note-item-title">{note.title}</div>
                                        <div className="note-item-preview">{preview}...</div>
                                        <div className="note-item-date">{new Date(note.updated_at).toLocaleDateString()}</div>
                                    </div>
                                    <button onClick={(e) => handleDelete(e, note.id)} className="delete-btn">×</button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className={`note-editor glass-panel ${!isEditing ? 'hidden-mobile' : ''}`}>
                {isEditing ? (
                    <>
                        <div className="editor-header">
                            <button
                                className="mobile-only back-btn-mini"
                                onClick={() => setIsEditing(false)}
                                style={{ display: 'none', marginRight: '10px' }}
                            >
                                ←
                            </button>
                            <Input
                                value={editTitle}
                                onChange={e => {
                                    setEditTitle(e.target.value);
                                    triggerAutoSave(e.target.value, editorRef.current?.innerHTML || '');
                                }}
                                placeholder="Note Title"
                                onKeyDown={handleTitleKeyDown}
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '5px',
                                    flex: 1
                                }}
                            />
                            <div className="editor-actions">
                                <span className={`save-status ${saveStatus}`}>
                                    {saveStatus === 'saving' && '⏳ Saving...'}
                                    {saveStatus === 'saved' && '✓ Saved'}
                                    {saveStatus === 'unsaved' && '● Unsaved'}
                                </span>
                                <Button onClick={handleSave} variant="primary" style={{ padding: '5px 15px', fontSize: '0.9rem' }}>Save & Close</Button>
                                <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
                                    <button className="icon-btn" style={{ fontSize: '1.2rem', cursor: 'pointer', background: 'none', border: 'none', padding: '5px', color: 'var(--text-color)' }}>⋮</button>
                                    <div className="dropdown-content">
                                        <button onClick={handleExportPDF}>Export PDF</button>
                                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', padding: '0 12px 5px' }}>(save before export)</div>
                                        <button onClick={(e) => handleDelete(e, selectedNote.id)} style={{ color: 'red' }}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="editor-toolbar">
                            <button onClick={() => execCmd('bold')} className="toolbar-btn" title="Bold"><b>B</b></button>
                            <button onClick={() => execCmd('italic')} className="toolbar-btn" title="Italic"><i>I</i></button>
                            <button onClick={() => execCmd('underline')} className="toolbar-btn" title="Underline"><u>U</u></button>
                            <div className="toolbar-separator"></div>
                            <button onClick={() => execCmd('insertUnorderedList')} className="toolbar-btn" title="List">•</button>
                            <button onClick={() => execCmd('formatBlock', 'blockquote')} className="toolbar-btn" title="Quote">"</button>
                        </div>

                        <div
                            id="printable-note"
                            className="editor-content"
                            contentEditable
                            ref={editorRef}
                            onInput={(e) => triggerAutoSave(editTitle, e.currentTarget.innerHTML)}
                            placeholder="Start typing..."
                        ></div>
                    </>
                ) : (
                    <div className="empty-state">
                        <p>Select a note or create a new one.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Note"
            >
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>Are you sure you want to delete this note?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmDelete} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .notes-container {
                    display: flex;
                    gap: 20px;
                    height: calc(100vh - 100px);
                    padding: 20px;
                    overflow: hidden;
                }

                .notes-sidebar {
                    width: 300px;
                    min-width: 280px;
                    display: flex;
                    flex-direction: column;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    flex-shrink: 0;
                }

                /* Search Bar */
                .notes-search {
                    margin-bottom: 15px;
                    flex-shrink: 0;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 15px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-color);
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }

                .search-input:focus {
                    border-color: var(--primary-color);
                    background: var(--card-bg);
                }

                .search-input::placeholder {
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .no-notes {
                    text-align: center;
                    padding: 30px;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .notes-list {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding-right: 4px;
                    margin-right: -4px;
                }

                .notes-list::-webkit-scrollbar {
                    width: 4px;
                }

                .notes-list::-webkit-scrollbar-track {
                    background: transparent;
                }

                .notes-list::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 2px;
                }

                .notes-list::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                .note-item {
                    padding: 12px 15px;
                    border-radius: 12px;
                    background: var(--card-bg);
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .note-item:hover {
                    background: var(--nav-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    border-color: var(--primary-color);
                }

                .note-item.pinned {
                    border-left: 3px solid #ffc107;
                    background: var(--card-elevated);
                }

                .pin-btn {
                    background: none;
                    border: none;
                    font-size: 12px;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.2s;
                    padding: 2px;
                    flex-shrink: 0;
                    color: var(--text-color);
                }

                .note-item:hover .pin-btn {
                    opacity: 0.6;
                }

                .note-item.pinned .pin-btn {
                    opacity: 1;
                    color: #ffc107;
                }

                .pin-btn:hover {
                    opacity: 1 !important;
                    transform: scale(1.1);
                }

                .note-item-content {
                    flex: 1;
                    min-width: 0;
                }

                .note-item-preview {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.5;
                    margin: 4px 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Duplicate .note-item removed */
                
                .note-item.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .note-item-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                }

                .note-item-date {
                    font-size: 0.8rem;
                    opacity: 0.7;
                }

                .note-item .delete-btn {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: none;
                    border: none;
                    color: inherit;
                    opacity: 0.5;
                    cursor: pointer;
                    font-size: 1.2rem;
                }
                .note-item .delete-btn:hover { opacity: 1; }

                .note-editor {
                    flex: 1;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .editor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    padding-bottom: 8px;
                }

                .editor-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .save-status {
                    font-size: 0.78rem;
                    padding: 3px 10px;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }

                .save-status.saving {
                    color: #fbbf24;
                    background: rgba(251, 191, 36, 0.1);
                    animation: pulse-saving 1.2s ease-in-out infinite;
                }

                .save-status.saved {
                    color: #34d399;
                    background: rgba(52, 211, 153, 0.1);
                }

                .save-status.unsaved {
                    color: #f87171;
                    background: rgba(248, 113, 113, 0.1);
                }

                .save-status.idle {
                    display: none;
                }

                @keyframes pulse-saving {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .editor-toolbar {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 10px;
                    margin-bottom: 10px;
                    padding: 10px 15px;
                    background: var(--card-elevated);
                    border-radius: 10px;
                    align-items: center;
                    border: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    z-index: 5;
                }

                .toolbar-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: var(--nav-hover-bg);
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    color: var(--text-color);
                    transition: all 0.2s;
                    font-size: 1rem;
                }
                .toolbar-btn:hover { background: var(--primary-color); color: white; transform: translateY(-1px); }
                
                .toolbar-separator {
                    width: 1px;
                    height: 24px;
                    background: rgba(255,255,255,0.15);
                    margin: 0 10px;
                }

                .editor-content {
                    flex: 1;
                    outline: none;
                    overflow-y: auto;
                    font-size: 1.1rem;
                    line-height: 1.6;
                    padding: 15px 20px;
                    line-height: 1.6;
                    padding: 15px 20px;
                    background: var(--card-bg);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }

                .editor-content blockquote {
                    border-left: 4px solid var(--primary-color);
                    margin: 0;
                    padding-left: 15px;
                    color: var(--text-color);
                    opacity: 0.8;
                    font-style: italic;
                }

                .empty-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .note-editor, .note-editor * {
                        visibility: visible;
                    }
                    .note-editor {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 40px;
                        background: white;
                        color: black;
                    }
                    .editor-header, .editor-toolbar, .editor-actions {
                        display: none !important;
                    }
                    /* Create a pseudo-element for the title since input values don't print well sometimes, 
                       or we rely on the input being visible. Better to print the input value. */
                    .editor-header {
                        display: block !important;
                        border: none;
                    }
                    .editor-header input {
                        border: none;
                        font-size: 24px;
                        font-weight: bold;
                        padding: 0;
                        margin-bottom: 20px;
                    }
                    .editor-actions { display: none !important; }
                }

                /* Dark mode overrides removed for theme consistency */

                .dropdown {
                    position: relative;
                    display: inline-block;
                }
                .dropdown-content {
                    display: none;
                    position: absolute;
                    right: 0;
                    background-color: #2a2d3e; /* Hardcoded dark bg for safety or use var */
                    min-width: 140px;
                    box-shadow: 0 8px 16px 0 rgba(0,0,0,0.3);
                    z-index: 10;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    overflow: hidden;
                    padding: 5px;
                }
                .dropdown:hover .dropdown-content {
                    display: block;
                }
                .dropdown-content button {
                    color: #fff;
                    padding: 10px 12px;
                    text-decoration: none;
                    display: block;
                    width: 100%;
                    text-align: left;
                    background: none;
                    border: none;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }
                .dropdown-content button:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                @media (max-width: 768px) {
                    .notes-container {
                        padding: 0;
                        height: calc(100vh - 80px); /* Account for bottom nav */
                        position: relative;
                    }

                    .notes-sidebar {
                        width: 100%;
                        border-radius: 0;
                        border: none;
                        background: var(--bg-color);
                    }

                    .notes-sidebar.hidden-mobile {
                        display: none;
                    }

                    .note-editor {
                        padding: 16px;
                        border-radius: 0;
                        border: none;
                        background: var(--bg-color);
                    }

                    .note-editor.hidden-mobile {
                        display: none;
                    }

                    .notes-list {
                        padding-right: 0;
                        margin-right: 0;
                    }

                    .note-item {
                        border-radius: 12px;
                        margin-bottom: 8px;
                    }

                    .search-input {
                        font-size: 16px; /* prevent iOS zoom */
                    }

                    .editor-toolbar {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        padding: 8px;
                        border-radius: 8px;
                        margin-bottom: 12px;
                    }

                    .mobile-only {
                        display: flex !important;
                    }

                    .back-btn-mini {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        background: rgba(255,255,255,0.08);
                        border: 1px solid rgba(255,255,255,0.1);
                        color: var(--text-color);
                        font-size: 1.1rem;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default Notes;
