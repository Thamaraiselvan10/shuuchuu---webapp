import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../context/TasksContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import DesktopIcon from '../components/DesktopIcon';
import TaskWindow from '../components/TaskWindow';
import IconPicker from '../components/IconPicker';
import { format } from 'date-fns';
import { Timer, AlertCircle, ChevronRight, Plus, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
    const { tasks, addTask, deleteTask, toggleTaskStatus, updateTask, updateTaskStatus, updateTaskPriority } = useTasks();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Mobile state
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileCategoryOpen, setMobileCategoryOpen] = useState(null);
    const [mobileViewMode, setMobileViewMode] = useState('cards');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Categories with icons
    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('task_categories_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    // Filter out Today's Focus if it exists (cleanup)
                    return parsed.filter(c => c.name !== "Today's Focus");
                }
            }

            // Migrate from old format
            const oldCategories = localStorage.getItem('task_categories');
            if (oldCategories) {
                const oldList = JSON.parse(oldCategories);
                if (Array.isArray(oldList)) {
                    return oldList.map(name => ({
                        name,
                        icon: getDefaultIcon(name)
                    }));
                }
            }
        } catch (e) {
            console.error('Failed to load categories:', e);
        }

        return [
            { name: 'General', icon: '📝' },
            { name: 'Work', icon: '💼' },
            { name: 'Personal', icon: '👤' },
            { name: 'Study', icon: '📚' },
            { name: 'Goal', icon: '🎯' },
            { name: 'Events', icon: '📅' }
        ];
    });

    // Window management state - persist open windows across navigation
    const [openWindows, setOpenWindows] = useState(() => {
        const saved = sessionStorage.getItem('desktop_open_windows');
        return saved ? JSON.parse(saved) : [];
    });
    const [minimizedWindows, setMinimizedWindows] = useState(() => {
        const saved = sessionStorage.getItem('desktop_minimized_windows');
        return saved ? JSON.parse(saved) : [];
    });
    const [windowPositions, setWindowPositions] = useState(() => {
        const saved = localStorage.getItem('desktop_window_positions');
        return saved ? JSON.parse(saved) : {};
    });
    const [windowSizes, setWindowSizes] = useState(() => {
        const saved = sessionStorage.getItem('desktop_window_sizes');
        return saved ? JSON.parse(saved) : {};
    });
    const [topZIndex, setTopZIndex] = useState(1);

    // Modal states
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
    const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
    const [isCategoryLimitModalOpen, setIsCategoryLimitModalOpen] = useState(false);
    const [pinnedCategories, setPinnedCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('pinnedCategories');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isPinCategoryModalOpen, setIsPinCategoryModalOpen] = useState(false);
    const [isContentBlurred, setIsContentBlurred] = useState(() => {
        const saved = localStorage.getItem('isContentBlurred');
        return saved ? JSON.parse(saved) : false;
    });

    const toggleContentBlur = () => {
        setIsContentBlurred(!isContentBlurred);
    };

    // Persist pinned categories
    useEffect(() => {
        localStorage.setItem('pinnedCategories', JSON.stringify(pinnedCategories));
    }, [pinnedCategories]);

    // Persist blur state and auto-clean
    useEffect(() => {
        if (openWindows.length === 0 && isContentBlurred) {
            setIsContentBlurred(false);
            localStorage.setItem('isContentBlurred', 'false');
        }
    }, [openWindows]);

    useEffect(() => {
        localStorage.setItem('isContentBlurred', JSON.stringify(isContentBlurred));
    }, [isContentBlurred]);

    const toggleCategoryPin = (catName) => {
        if (pinnedCategories.includes(catName)) {
            setPinnedCategories(pinnedCategories.filter(c => c !== catName));
        } else {
            if (pinnedCategories.length < 5) {
                setPinnedCategories([...pinnedCategories, catName]);
            } else {
                showToast('You can only pin up to 5 categories', 'warning');
            }
        }
    };
    const [selectedCategoryForFocus, setSelectedCategoryForFocus] = useState(null);
    const [selectedTasksForFocus, setSelectedTasksForFocus] = useState([]);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState(null); // 'task' or 'category'

    // New task form
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        category: 'General',
        priority: 0,
        due_at: ''
    });

    // Event Creation State
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: '',
        category: 'Event',
        due_at: ''
    });

    // Event specific categories
    const eventCategories = ['Event', 'Work', 'Personal', 'Health', 'Learning', 'Meeting', 'Deadline'];

    // New category form
    const [newCategory, setNewCategory] = useState({ name: '', icon: '📁' });

    // Selected icon for context menu
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Refs
    const descRef = useRef(null);
    const containerRef = useRef(null);

    // Save categories to localStorage
    useEffect(() => {
        localStorage.setItem('task_categories_v2', JSON.stringify(categories));
    }, [categories]);

    // Save window positions
    useEffect(() => {
        localStorage.setItem('desktop_window_positions', JSON.stringify(windowPositions));
    }, [windowPositions]);

    // Save open windows to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('desktop_open_windows', JSON.stringify(openWindows));
    }, [openWindows]);

    // Save minimized windows to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('desktop_minimized_windows', JSON.stringify(minimizedWindows));
    }, [minimizedWindows]);

    // Save window sizes to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('desktop_window_sizes', JSON.stringify(windowSizes));
    }, [windowSizes]);

    // Check URL params and auto-open Focus window if ?focus=true
    const [searchParams] = useSearchParams();
    useEffect(() => {
        if (searchParams.get('focus') === 'true') {
            // Small delay to ensure component is mounted
            setTimeout(() => {
                openFocusWindow();
            }, 100);
        }
    }, [searchParams]);

    // Add categories from existing tasks
    useEffect(() => {
        if (tasks.length > 0) {
            const usedCategories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
            setCategories(prev => {
                const existingNames = prev.map(c => c.name);
                const newCategories = usedCategories
                    .filter(name => !existingNames.includes(name))
                    .map(name => ({ name, icon: getDefaultIcon(name) }));
                return [...prev, ...newCategories];
            });
        }
    }, [tasks]);

    // Helper to get default icon for category name
    function getDefaultIcon(name) {
        const iconMap = {
            'General': '📝',
            'Work': '💼',
            'Personal': '👤',
            'Study': '📚',
            'Goal': '🎯',
            'Events': '📅',
            'Shopping': '🛒',
            'Health': '💪',
            'Finance': '💰'
        };
        return iconMap[name] || '📁';
    }

    // Window management functions
    const openCategoryWindow = (category) => {
        if (minimizedWindows.includes(category.name)) {
            // Restore from minimized
            setMinimizedWindows(prev => prev.filter(n => n !== category.name));
            if (!openWindows.find(w => w.name === category.name)) {
                setOpenWindows(prev => [...prev, category]);
            }
        } else if (!openWindows.find(w => w.name === category.name)) {
            // Open new window
            const offset = openWindows.length * 30;
            setWindowPositions(prev => ({
                ...prev,
                [category.name]: prev[category.name] || { x: 150 + offset, y: 80 + offset }
            }));
            setWindowSizes(prev => ({
                ...prev,
                [category.name]: prev[category.name] || { width: 700, height: 500 }
            }));
            setOpenWindows(prev => [...prev, { ...category, zIndex: topZIndex + 1 }]);
            setTopZIndex(prev => prev + 1);
        }
        bringToFront(category.name);
    };

    const closeWindow = (name) => {
        setOpenWindows(prev => prev.filter(w => w.name !== name));
    };

    const minimizeWindow = (name) => {
        setOpenWindows(prev => prev.filter(w => w.name !== name));
        if (!minimizedWindows.includes(name)) {
            setMinimizedWindows(prev => [...prev, name]);
        }
    };

    const maximizeWindow = (name) => {
        setOpenWindows(prev => prev.map(w =>
            w.name === name ? { ...w, isMaximized: !w.isMaximized } : w
        ));
    };

    const bringToFront = (name) => {
        const newZ = topZIndex + 1;
        setTopZIndex(newZ);
        setOpenWindows(prev => prev.map(w =>
            w.name === name ? { ...w, zIndex: newZ } : w
        ));
    };

    const handlePositionChange = (name, position) => {
        setWindowPositions(prev => ({ ...prev, [name]: position }));
    };

    const handleSizeChange = (name, size) => {
        setWindowSizes(prev => ({ ...prev, [name]: size }));
    };

    // Task functions
    const handleCreateTask = async () => {
        if (!newTask.title.trim()) return;

        const taskToCreate = {
            ...newTask,
            due_at: newTask.due_at ? new Date(newTask.due_at).toISOString() : null
        };

        await addTask(taskToCreate);
        setNewTask({ title: '', description: '', category: 'General', priority: 0, due_at: '' });
        setIsNewTaskModalOpen(false);
        showToast('Task created successfully!', 'success');
    };

    const handleCreateEvent = async () => {
        if (!newEvent.title.trim() || !newEvent.due_at) {
            showToast('Please provide a title and date', 'error');
            return;
        }

        const eventToCreate = {
            title: newEvent.title,
            description: 'Event created from Quick Actions',
            category: newEvent.category,
            priority: 1, // Medium priority by default for events
            due_at: new Date(newEvent.due_at).toISOString(),
            status: 'pending'
        };

        await addTask(eventToCreate);
        setNewEvent({ title: '', category: 'Event', due_at: '' });
        setIsEventModalOpen(false);
        showToast('Event created successfully!', 'success');
    };

    const handleDeleteTask = async (id) => {
        setItemToDelete(id);
        setDeleteType('task');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deleteType === 'task' && itemToDelete) {
            await deleteTask(itemToDelete);
            showToast('Task deleted', 'success');
        } else if (deleteType === 'category' && itemToDelete) {
            // 1. Reassign all tasks in this category to 'General'
            const tasksToUpdate = tasks.filter(t => t.category === itemToDelete);
            for (const t of tasksToUpdate) {
                await updateTask(t.id, { category: 'General' });
            }

            // 2. Remove category from categories state
            setCategories(prev => {
                const updated = prev.filter(c => c.name !== itemToDelete);
                localStorage.setItem('task_categories_v2', JSON.stringify(updated));
                return updated;
            });

            // 3. Remove from pinned, open, minimized windows
            setPinnedCategories(prev => prev.filter(c => c !== itemToDelete));
            closeWindow(itemToDelete);
            setMinimizedWindows(prev => prev.filter(n => n !== itemToDelete));

            showToast(`Category "${itemToDelete}" deleted`, 'success');
            // 4. Redirect to main tasks page (close mobile category sheet)
            setMobileCategoryOpen(null);
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setDeleteType(null);
    };

    // Category functions
    const CATEGORY_LIMIT = 15;

    const handleCreateCategory = () => {
        if (!newCategory.name.trim()) return;

        // Check category limit
        if (categories.length >= CATEGORY_LIMIT) {
            setIsNewCategoryModalOpen(false);
            setIsCategoryLimitModalOpen(true);
            return;
        }

        if (categories.some(c => c.name.toLowerCase() === newCategory.name.trim().toLowerCase())) {
            showToast('Category already exists', 'error');
            return;
        }

        const category = {
            name: newCategory.name.trim(),
            icon: newCategory.icon || '📁'
        };

        setCategories(prev => [...prev, category]);
        setNewCategory({ name: '', icon: '📁' });
        setIsNewCategoryModalOpen(false);
        showToast('Category created!', 'success');
    };

    const handleIconContextMenu = (e, category) => {
        e.preventDefault();
        setContextMenu({
            type: 'category',
            x: e.clientX,
            y: e.clientY,
            data: category
        });
        setSelectedIcon(category.name);
    };

    const handleTaskContextMenu = (e, task) => {
        e.preventDefault();
        setContextMenu({
            type: 'task',
            x: e.clientX,
            y: e.clientY,
            data: task
        });
    };

    const handleDeleteCategory = (category) => {
        setItemToDelete(category.name);
        setDeleteType('category');
        setIsDeleteModalOpen(true);
        setContextMenu(null);
    };

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // Get tasks for a category
    const getTasksForCategory = (categoryName) => {
        return tasks.filter(t => t.category === categoryName);
    };

    // Get task count for a category
    const getTaskCount = (categoryName) => {
        return tasks.filter(t => t.category === categoryName && t.status !== 'completed').length;
    };

    // Open task modal with pre-selected category
    const openNewTaskModal = (categoryName = 'General') => {
        setNewTask(prev => ({ ...prev, category: categoryName }));
        setIsNewTaskModalOpen(true);
    };

    // Focus Mode Logic
    const handleAddToFocus = async () => {
        try {
            await Promise.all(selectedTasksForFocus.map(taskId =>
                updateTask(taskId, { is_today_focus: 1 })
            ));
            setIsFocusModalOpen(false);
            setSelectedTasksForFocus([]);
            showToast('Tasks added to Today\'s Focus', 'success');
        } catch (error) {
            showToast('Failed to update tasks', 'error');
        }
    };

    const toggleTaskSelection = (taskId) => {
        setSelectedTasksForFocus(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const removeFromFocus = async (e, task) => {
        e.stopPropagation();
        await updateTask(task.id, { is_today_focus: 0 });
        showToast('Removed from focus', 'info');
    };

    // Open Today's Focus Window
    const openFocusWindow = () => {
        const focusWindowName = "Today's Focus";
        if (minimizedWindows.includes(focusWindowName)) {
            setMinimizedWindows(prev => prev.filter(n => n !== focusWindowName));
            bringToFront(focusWindowName);
            return;
        }

        if (!openWindows.find(w => w.name === focusWindowName)) {
            setOpenWindows(prev => [...prev, {
                name: focusWindowName,
                icon: '📌',
                type: 'focus', // Special identifier
                zIndex: Math.max(...prev.map(w => w.zIndex || 0), 0) + 1
            }]);
            setWindowPositions(prev => ({
                ...prev,
                [focusWindowName]: { x: 100, y: 100 }
            }));
        } else {
            bringToFront(focusWindowName);
        }
    };

    // Mobile category tasks
    const getMobileCategoryTasks = () => {
        if (!mobileCategoryOpen) return [];
        if (mobileCategoryOpen === "Today's Focus") {
            return tasks.filter(t => t.is_today_focus === 1);
        }
        return getTasksForCategory(mobileCategoryOpen);
    };

    return (
        <div className="desktop-container" ref={containerRef} onClick={() => setSelectedIcon(null)}>

            {/* ===== MOBILE VIEW ===== */}
            {isMobile ? (
                <div className="mobile-tasks-container">
                    {/* Mobile Stats Row */}
                    <div className="mobile-stats-row">
                        <div className="mobile-stat">
                            <span className="mobile-stat-val">{tasks.filter(t => t.status === 'completed').length}</span>
                            <span className="mobile-stat-lbl">Done</span>
                        </div>
                        <div className="mobile-stat">
                            <span className="mobile-stat-val">{tasks.filter(t => t.status === 'pending').length}</span>
                            <span className="mobile-stat-lbl">To Do</span>
                        </div>
                        <div className="mobile-stat">
                            <span className="mobile-stat-val">{tasks.filter(t => t.status === 'progress').length}</span>
                            <span className="mobile-stat-lbl">In Progress</span>
                        </div>
                        <div className="mobile-stat">
                            <span className="mobile-stat-val">{tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'completed').length}</span>
                            <span className="mobile-stat-lbl">Overdue</span>
                        </div>
                    </div>

                    {/* Mobile Quick Actions */}
                    <div className="mobile-quick-actions">
                        <button onClick={() => openNewTaskModal()} className="mobile-action-btn primary">
                            <Plus size={16} /> New Task
                        </button>
                        <button onClick={() => setIsNewCategoryModalOpen(true)} className="mobile-action-btn">
                            📁 Category
                        </button>
                        <button onClick={() => setIsEventModalOpen(true)} className="mobile-action-btn">
                            📅 Event
                        </button>
                    </div>

                    {/* Today's Focus Section */}
                    {tasks.filter(t => t.is_today_focus === 1 && t.status !== 'completed').length > 0 && (
                        <div className="mobile-category-item mobile-focus-section" onClick={() => setMobileCategoryOpen("Today's Focus")}>
                            <div className="mobile-cat-left">
                                <span className="mobile-cat-icon">📌</span>
                                <span className="mobile-cat-name">Today's Focus</span>
                            </div>
                            <div className="mobile-cat-right">
                                <span className="mobile-cat-count">{tasks.filter(t => t.is_today_focus === 1 && t.status !== 'completed').length}</span>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    )}

                    {/* Category List */}
                    <div className="mobile-section-label">Categories</div>
                    <div className="mobile-category-list">
                        {categories.map(cat => {
                            const count = getTaskCount(cat.name);
                            const total = getTasksForCategory(cat.name).length;
                            return (
                                <div
                                    key={cat.name}
                                    className="mobile-category-item"
                                    onClick={() => setMobileCategoryOpen(cat.name)}
                                >
                                    <div className="mobile-cat-left">
                                        <span className="mobile-cat-icon">{cat.icon}</span>
                                        <div className="mobile-cat-info">
                                            <span className="mobile-cat-name">{cat.name}</span>
                                            <span className="mobile-cat-total">{total} task{total !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                    <div className="mobile-cat-right">
                                        {count > 0 && <span className="mobile-cat-count">{count}</span>}
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile Category Detail Sheet */}
                    {mobileCategoryOpen && (
                        <div className="mobile-category-sheet">

                            <div className="mobile-sheet-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <button className="mobile-back-btn" onClick={() => setMobileCategoryOpen(null)}>
                                    <X size={20} />
                                </button>
                                <h2 className="mobile-sheet-title" style={{ flex: 1, textAlign: 'center', margin: 0 }}>
                                    {categories.find(c => c.name === mobileCategoryOpen)?.icon || '📌'} {mobileCategoryOpen}
                                </h2>
                                {mobileCategoryOpen !== "Today's Focus" && (
                                    <>
                                        <button className="mobile-add-task-btn" onClick={() => openNewTaskModal(mobileCategoryOpen)}>
                                            <Plus size={18} />
                                        </button>
                                        <button
                                            className="mobile-delete-category-btn"
                                            style={{ marginLeft: 8, background: 'none', border: 'none', color: '#ff4444', padding: 4, borderRadius: 6, cursor: 'pointer' }}
                                            title="Delete Category"
                                            onClick={() => {
                                                setItemToDelete(mobileCategoryOpen);
                                                setDeleteType('category');
                                                setIsDeleteModalOpen(true);
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                <Trash2 size={18} />
                                            </span>
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="mobile-sheet-content">
                                <TaskWindow
                                    id={mobileCategoryOpen}
                                    title={mobileCategoryOpen}
                                    icon={categories.find(c => c.name === mobileCategoryOpen)?.icon || '📌'}
                                    tasks={getMobileCategoryTasks()}
                                    allowAddTask={mobileCategoryOpen !== "Today's Focus"}
                                    showCategory={mobileCategoryOpen === "Today's Focus"}
                                    isMinimized={false}
                                    isMaximized={true}
                                    position={{ x: 0, y: 0 }}
                                    size={{ width: '100%', height: '100%' }}
                                    zIndex={1}
                                    onClose={() => setMobileCategoryOpen(null)}
                                    onMinimize={() => {}}
                                    onMaximize={() => {}}
                                    onFocus={() => {}}
                                    onPositionChange={() => {}}
                                    onSizeChange={() => {}}
                                    onTaskToggle={toggleTaskStatus}
                                    onTaskDelete={deleteTask}
                                    onTaskStatusChange={updateTaskStatus}
                                    onTaskPriorityChange={updateTaskPriority}
                                    onAddTask={() => openNewTaskModal(mobileCategoryOpen)}
                                    onTaskContextMenu={handleTaskContextMenu}
                                    isBlurred={false}
                                    onToggleBlur={() => {}}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
            <>
            {/* Desktop Background Grid Pattern */}
            <div className="desktop-background"></div>

            {/* Desktop Icons Area */}
            <div className={`desktop-icons-area ${isContentBlurred ? 'blurred' : ''}`}>
                {/* Desktop Icons */}
                <DesktopIcon
                    icon="📝"
                    name="Notes"
                    onDoubleClick={() => navigate('/notes')}
                    isSelected={selectedIcon === "Notes"}
                    onSelect={() => setSelectedIcon("Notes")}
                />
                <DesktopIcon
                    icon="📌"
                    name="Today's Focus"
                    taskCount={tasks.filter(t => t.is_today_focus === 1 && t.status !== 'completed').length}
                    onDoubleClick={openFocusWindow}
                    onContextMenu={(e) => { e.preventDefault(); }}
                    isSelected={selectedIcon === "Today's Focus"}
                    onSelect={() => setSelectedIcon("Today's Focus")}
                />
                {categories.map((category) => (
                    <DesktopIcon
                        key={category.name}
                        icon={category.icon}
                        name={category.name}
                        taskCount={getTaskCount(category.name)}
                        onDoubleClick={() => openCategoryWindow(category)}
                        onContextMenu={(e) => handleIconContextMenu(e, category)}
                        isSelected={selectedIcon === category.name}
                        onSelect={() => setSelectedIcon(category.name)}
                    />
                ))}

                {/* Add Category Icon */}
                <div
                    className="desktop-icon add-icon"
                    onDoubleClick={() => setIsNewCategoryModalOpen(true)}
                    title="Add new category"
                >
                    <div className="desktop-icon-image add">
                        <span className="desktop-icon-emoji">➕</span>
                    </div>
                    <div className="desktop-icon-label">New Category</div>
                </div>
            </div>

            {/* Productivity Dashboard - Below Icons */}
            <div className={`productivity-dashboard ${isContentBlurred ? 'blurred' : ''}`}>
                {/* Stats Cards - Dashboard Style */}
                <div className="stats-row">
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon" style={{ background: 'rgba(46, 204, 113, 0.15)' }}>
                            <span style={{ color: '#2ecc71' }}>✓</span>
                        </div>
                        <div className="dash-stat-content">
                            <span className="dash-stat-value">{tasks.filter(t => t.status === 'completed').length}/{tasks.length}</span>
                            <span className="dash-stat-label">Tasks Done</span>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon" style={{ background: 'rgba(155, 89, 182, 0.15)' }}>
                            <span style={{ color: '#9b59b6' }}>📋</span>
                        </div>
                        <div className="dash-stat-content">
                            <span className="dash-stat-value">{tasks.filter(t => t.status === 'pending').length}</span>
                            <span className="dash-stat-label">To Do</span>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon" style={{ background: 'rgba(52, 152, 219, 0.15)' }}>
                            <span style={{ color: '#3498db' }}>🚀</span>
                        </div>
                        <div className="dash-stat-content">
                            <span className="dash-stat-value">{tasks.filter(t => t.status === 'progress').length}</span>
                            <span className="dash-stat-label">In Progress</span>
                        </div>
                    </div>
                    <div className="dash-stat-card">
                        <div className="dash-stat-icon" style={{ background: 'rgba(255, 77, 77, 0.15)' }}>
                            <span style={{ color: '#ff4d4d' }}>⚠</span>
                        </div>
                        <div className="dash-stat-content">
                            <span className="dash-stat-value">
                                {tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'completed').length}
                            </span>
                            <span className="dash-stat-label">Overdue</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Recent Tasks */}
                <div className="dashboard-widgets">
                    {/* Quick Actions */}
                    <div className="widget quick-actions">
                        <h3>⚡ Quick Actions</h3>
                        <div className="action-buttons">
                            <button onClick={() => openNewTaskModal()} className="action-btn primary">
                                <span>➕</span> New Task
                            </button>
                            <button onClick={() => setIsNewCategoryModalOpen(true)} className="action-btn">
                                <span>📁</span> New Category
                            </button>
                            <button onClick={() => setIsEventModalOpen(true)} className="action-btn">
                                <span>📅</span> Create Event
                            </button>

                        </div>
                    </div>

                    {/* Recent/Today's Tasks */}
                    <div className="widget recent-tasks">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>📌 Today's Focus</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={openFocusWindow}
                                    className="action-btn-icon"
                                    title="Open Full View"
                                    style={{
                                        background: 'var(--nav-hover-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        cursor: 'pointer',
                                        color: 'var(--text-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ⤢
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedCategoryForFocus(categories[0]?.name);
                                        setIsFocusModalOpen(true);
                                    }}
                                    className="action-btn-icon"
                                    title="Add tasks to focus"
                                    style={{
                                        background: 'var(--nav-hover-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        cursor: 'pointer',
                                        color: 'var(--text-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ＋
                                </button>
                            </div>
                        </div>
                        <div className="recent-list">
                            {tasks
                                .filter(t => t.is_today_focus === 1 && t.status !== 'completed')
                                .sort((a, b) => {
                                    if (a.priority !== b.priority) return b.priority - a.priority;
                                    if (a.due_at && b.due_at) return new Date(a.due_at) - new Date(b.due_at);
                                    return 0;
                                })
                                .slice(0, 4)
                                .map(task => (
                                    <div key={task.id} className="recent-task-item">
                                        <span className={`priority-dot p${task.priority}`}></span>
                                        <span className="recent-task-title">{task.title}</span>
                                        <span className="recent-task-category">{task.category}</span>
                                        <button
                                            onClick={(e) => removeFromFocus(e, task)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ff4444',
                                                cursor: 'pointer',
                                                opacity: 0.6,
                                                fontSize: '12px',
                                                marginLeft: 'auto',
                                                padding: '4px'
                                            }}
                                            title="Remove from focus"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            }
                            {tasks.filter(t => t.is_today_focus === 1 && t.status !== 'completed').length === 0 && (
                                <div className="no-tasks-msg">
                                    <p>Select tasks to focus on today!</p>
                                    <Button onClick={() => setIsFocusModalOpen(true)} style={{ marginTop: '10px', fontSize: '0.8rem' }}>Select Tasks</Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Overview */}
                    {/* Category Overview */}
                    <div className="widget category-overview">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>📊 Category Overview</h3>
                            {pinnedCategories.length < 5 && (
                                <button
                                    onClick={() => setIsPinCategoryModalOpen(true)}
                                    className="action-btn-icon"
                                    title="Pin Category"
                                    style={{
                                        background: 'var(--nav-hover-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        cursor: 'pointer',
                                        color: 'var(--text-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px'
                                    }}
                                >
                                    ＋
                                </button>
                            )}
                        </div>

                        {pinnedCategories.length === 0 ? (
                            <div className="no-tasks-msg" style={{ padding: '20px 0' }}>
                                <p style={{ marginBottom: '10px' }}>Pin up to 5 categories to specificially track their progress.</p>
                                <Button onClick={() => setIsPinCategoryModalOpen(true)} style={{ fontSize: '0.8rem' }}>
                                    <span>📌</span> Pin Category
                                </Button>
                            </div>
                        ) : (
                            <div className="category-bars">
                                {pinnedCategories.map(catName => {
                                    const cat = categories.find(c => c.name === catName);
                                    if (!cat) return null;

                                    const count = getTaskCount(cat.name);
                                    const maxCount = Math.max(...categories.map(c => getTaskCount(c.name)), 1);
                                    const percentage = (count / maxCount) * 100;
                                    return (
                                        <div key={cat.name} className="category-bar-item" style={{ position: 'relative' }}>
                                            <div className="bar-label">
                                                <span>{cat.icon} {cat.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>{count}</span>
                                                    <button
                                                        onClick={() => toggleCategoryPin(cat.name)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--text-color)',
                                                            opacity: 0.3,
                                                            cursor: 'pointer',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.target.style.opacity = '0.3'}
                                                        title="Unpin"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="bar-track">
                                                <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Open Windows */}
            {openWindows.map((window) => {
                const isFocusWindow = window.type === 'focus';
                const windowTasks = isFocusWindow
                    ? tasks.filter(t => t.is_today_focus === 1)
                    : getTasksForCategory(window.name);

                return (
                    <TaskWindow
                        key={window.name}
                        id={window.name}
                        title={window.name}
                        icon={window.icon}
                        tasks={windowTasks}
                        allowAddTask={!isFocusWindow}
                        showCategory={isFocusWindow}
                        isMinimized={false}
                        isMaximized={window.isMaximized || false}
                        position={windowPositions[window.name] || { x: 150, y: 80 }}
                        size={windowSizes[window.name] || { width: 700, height: 500 }}
                        zIndex={window.zIndex || 1}
                        onClose={closeWindow}
                        onMinimize={minimizeWindow}
                        onMaximize={maximizeWindow}
                        onFocus={() => bringToFront(window.name)}
                        onPositionChange={handlePositionChange}
                        onSizeChange={handleSizeChange}
                        onTaskToggle={toggleTaskStatus}
                        onTaskDelete={deleteTask}
                        onTaskStatusChange={updateTaskStatus}
                        onTaskPriorityChange={updateTaskPriority}
                        onAddTask={() => openNewTaskModal(window.name)}
                        onTaskContextMenu={handleTaskContextMenu}
                        isBlurred={isContentBlurred}
                        onToggleBlur={toggleContentBlur}
                    />
                );
            })}

            {/* Minimized Windows Dock */}
            {minimizedWindows.length > 0 && (
                <div className={`minimized-dock ${isContentBlurred ? 'blurred' : ''}`}>
                    {minimizedWindows.map(name => {
                        const category = categories.find(c => c.name === name);
                        return (
                            <button
                                key={name}
                                className="dock-item"
                                onClick={() => openCategoryWindow(category || { name, icon: '📁' })}
                                title={name}
                            >
                                <span className="dock-icon">{category?.icon || '📁'}</span>
                                <span className="dock-label">{name}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Floating Action Buttons */}
            <div className="desktop-fab-container">
                <button
                    className="desktop-fab primary"
                    onClick={() => openNewTaskModal()}
                    title="Add new task"
                >
                    <span>+</span>
                </button>
            </div>

            </>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.type === 'category' ? (
                        <>
                            <div className="context-menu-header">
                                <span className="context-menu-icon">{contextMenu.data.icon}</span>
                                <span className="context-menu-title">{contextMenu.data.name}</span>
                            </div>
                            <div className="context-divider"></div>
                            <button className="context-btn" onClick={() => {
                                openCategoryWindow(contextMenu.data);
                                setContextMenu(null);
                            }}>
                                <span className="context-btn-icon open">⎋</span>
                                <span>Open</span>
                            </button>
                            <button className="context-btn" onClick={() => {
                                openNewTaskModal(contextMenu.data.name);
                                setContextMenu(null);
                            }}>
                                <span className="context-btn-icon add">+</span>
                                <span>Add Task</span>
                            </button>
                            <div className="context-divider"></div>
                            <button
                                className="context-btn danger"
                                onClick={() => handleDeleteCategory(contextMenu.data)}
                            >
                                <span className="context-btn-icon delete">✕</span>
                                <span>Delete Category</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="context-menu-header">
                                <span className="context-menu-title">{contextMenu.data.title}</span>
                            </div>
                            <div className="context-divider"></div>
                            <button className="context-btn" onClick={() => {
                                toggleTaskStatus(contextMenu.data.id, contextMenu.data.status);
                                setContextMenu(null);
                            }}>
                                <span className="context-btn-icon complete">{contextMenu.data.status === 'completed' ? '○' : '✓'}</span>
                                <span>{contextMenu.data.status === 'completed' ? 'Mark Undone' : 'Mark Complete'}</span>
                            </button>
                            <div className="context-divider"></div>
                            <button
                                className="context-btn danger"
                                onClick={() => {
                                    handleDeleteTask(contextMenu.data.id);
                                    setContextMenu(null);
                                }}
                            >
                                <span className="context-btn-icon delete">✕</span>
                                <span>Delete Task</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* New Task Modal */}
            <Modal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} title="New Task">
                <div style={{ display: 'flex', gap: '24px' }}>
                    {/* Left Column: Title & Description */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>Title</label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="What needs to be done?"
                                className="anime-input"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && descRef.current?.focus()}
                            />
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>Description</label>
                            <textarea
                                ref={descRef}
                                value={newTask.description}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                placeholder="Add details..."
                                className="anime-input"
                                style={{ flex: 1, minHeight: '100px', resize: 'none', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>

                    {/* Right Column: Category, Priority, Due Date */}
                    <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>Category</label>
                            <select
                                value={newTask.category}
                                onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                                className="anime-input"
                                style={{ width: '100%', cursor: 'pointer' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>Priority</label>
                            <select
                                value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                                className="anime-input"
                                style={{ width: '100%', cursor: 'pointer' }}
                            >
                                <option value={0}>🟢 Low</option>
                                <option value={1}>🟡 Medium</option>
                                <option value={2}>🔴 High</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>Due Date</label>
                            <input
                                type="datetime-local"
                                value={newTask.due_at}
                                onChange={e => setNewTask({ ...newTask, due_at: e.target.value })}
                                className="anime-input"
                                style={{ width: '100%' }}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <Button onClick={handleCreateTask} style={{ width: '100%' }}>Save Task</Button>
                </div>
            </Modal>

            {/* New Category Modal */}
            <Modal isOpen={isNewCategoryModalOpen} onClose={() => setIsNewCategoryModalOpen(false)} title="New Category">
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category Name</label>
                    <input
                        type="text"
                        value={newCategory.name}
                        onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g. Shopping"
                        className="anime-input"
                        autoFocus
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Icon</label>
                    <div className="icon-selector">
                        <button
                            type="button"
                            className="selected-icon-btn"
                            onClick={() => setIsIconPickerOpen(true)}
                        >
                            <span className="icon-preview">{newCategory.icon}</span>
                            <span className="change-text">Change</span>
                        </button>
                    </div>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button onClick={handleCreateCategory}>Add Category</Button>
                </div>
            </Modal>

            {/* Icon Picker */}
            {isIconPickerOpen && (
                <IconPicker
                    selectedIcon={newCategory.icon}
                    onSelect={(icon) => setNewCategory({ ...newCategory, icon })}
                    onClose={() => setIsIconPickerOpen(false)}
                />
            )}

            {/* Create Event Modal */}
            <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title="Create New Event">
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Event Title</label>
                    <input
                        type="text"
                        value={newEvent.title}
                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="e.g. Team Meeting"
                        className="anime-input"
                        autoFocus
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date & Time</label>
                    <input
                        type="datetime-local"
                        value={newEvent.due_at}
                        onChange={e => setNewEvent({ ...newEvent, due_at: e.target.value })}
                        className="anime-input"
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
                    <select
                        value={newEvent.category}
                        onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                        className="anime-input"
                        style={{ width: '100%', cursor: 'pointer' }}
                    >
                        {eventCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button onClick={handleCreateEvent}>Create Event</Button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete ${deleteType === 'task' ? 'Task' : 'Category'}`}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)' }}>
                        {deleteType === 'task'
                            ? 'Are you sure you want to delete this task?'
                            : `Delete category "${itemToDelete}"? Tasks will keep their category but won't be listed under it.`
                        }
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <Button onClick={() => setIsDeleteModalOpen(false)} style={{ background: 'var(--card-bg)', color: 'var(--text-color)' }}>Cancel</Button>
                        <Button onClick={confirmDelete} style={{ background: '#ff4444', color: 'white' }}>Delete</Button>
                    </div>
                </div>
            </Modal>

            {/* Focus Selection Modal */}
            <Modal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} title="Set Today's Focus">
                <div style={{ display: 'flex', height: '400px', gap: '20px' }}>
                    {/* Left: Categories */}
                    <div style={{
                        width: '200px',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        paddingRight: '15px',
                        overflowY: 'auto'
                    }}>
                        <h4 style={{ marginTop: 0, color: '#aaa', fontSize: '0.9rem' }}>CATEGORIES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setSelectedCategoryForFocus(cat.name)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '10px',
                                        background: selectedCategoryForFocus === cat.name ? 'rgba(73, 136, 196, 0.2)' : 'transparent',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: selectedCategoryForFocus === cat.name ? '#4988C4' : '#e0e0e0',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <span>{cat.icon}</span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Tasks */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ marginTop: 0, color: '#aaa', fontSize: '0.9rem' }}>
                            TASKS IN "{selectedCategoryForFocus}"
                        </h4>
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
                            {getTasksForCategory(selectedCategoryForFocus)
                                .filter(t => t.status !== 'completed' && (!t.is_today_focus)) // Filter out completed and already focused
                                .length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                                    No available tasks in this category
                                </div>
                            ) : (
                                getTasksForCategory(selectedCategoryForFocus)
                                    .filter(t => t.status !== 'completed' && (!t.is_today_focus))
                                    .map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => toggleTaskSelection(task.id)}
                                            style={{
                                                padding: '12px',
                                                marginBottom: '8px',
                                                background: selectedTasksForFocus.includes(task.id) ? 'rgba(46, 204, 113, 0.15)' : 'rgba(255,255,255,0.03)',
                                                border: selectedTasksForFocus.includes(task.id) ? '1px solid #2ecc71' : '1px solid transparent',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '4px',
                                                border: selectedTasksForFocus.includes(task.id) ? 'none' : '2px solid #555',
                                                background: selectedTasksForFocus.includes(task.id) ? '#2ecc71' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '12px'
                                            }}>
                                                {selectedTasksForFocus.includes(task.id) && '✓'}
                                            </div>
                                            <span>{task.title}</span>
                                        </div>
                                    ))
                            )}
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', marginTop: '10px', textAlign: 'right' }}>
                            <Button
                                onClick={handleAddToFocus}
                                disabled={selectedTasksForFocus.length === 0}
                                style={{ opacity: selectedTasksForFocus.length === 0 ? 0.5 : 1 }}
                            >
                                Add to Focus ({selectedTasksForFocus.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Category Limit Modal */}
            <Modal isOpen={isCategoryLimitModalOpen} onClose={() => setIsCategoryLimitModalOpen(false)} title="">
                <div style={{
                    textAlign: 'center',
                    padding: '30px 20px',
                    maxWidth: '500px'
                }}>
                    <div style={{
                        marginBottom: '20px',
                        color: 'var(--primary-color)',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={64} strokeWidth={1.5} />
                    </div>
                    <h3 style={{
                        margin: '0 0 16px',
                        fontSize: '1.3rem',
                        fontWeight: '600',
                        color: 'var(--text-color)'
                    }}>
                        You've Reached the Limit
                    </h3>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        margin: '0 0 24px'
                    }}>
                        You can only create <strong style={{ color: 'var(--primary-color)' }}>15 categories</strong>.
                        Too many categories can be overwhelming — focus on what truly matters!
                    </p>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.85rem',
                        fontStyle: 'italic',
                        margin: '0 0 24px'
                    }}>
                        "Simplicity is the ultimate sophistication."
                    </p>
                    <Button
                        onClick={() => setIsCategoryLimitModalOpen(false)}
                        style={{
                            padding: '12px 32px',
                            fontSize: '1rem'
                        }}
                    >
                        Got it!
                    </Button>
                </div>
            </Modal>

            {/* Pin Category Modal */}
            <Modal isOpen={isPinCategoryModalOpen} onClose={() => setIsPinCategoryModalOpen(false)} title="Manage Pinned Categories">
                <div style={{ padding: '20px', minWidth: '350px' }}>
                    <p style={{ marginBottom: '15px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Select up to 5 categories to pin to your overview ({pinnedCategories.length}/5):
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {categories.map(cat => {
                            const isPinned = pinnedCategories.includes(cat.name);
                            return (
                                <button
                                    key={cat.name}
                                    onClick={() => toggleCategoryPin(cat.name)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px',
                                        background: isPinned ? 'rgba(46, 204, 113, 0.15)' : 'var(--card-bg)',
                                        border: isPinned ? '1px solid #2ecc71' : '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        color: isPinned ? '#2ecc71' : 'var(--text-color)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        opacity: (!isPinned && pinnedCategories.length >= 5) ? 0.5 : 1
                                    }}
                                    className="category-select-btn"
                                    disabled={!isPinned && pinnedCategories.length >= 5}
                                >
                                    <span>{cat.icon}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isPinned ? 600 : 400 }}>{cat.name}</span>
                                    {isPinned && <span style={{ marginLeft: 'auto', fontSize: '12px' }}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setIsPinCategoryModalOpen(false)} style={{ padding: '8px 24px' }}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>

            <style>{`
                .desktop-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    background: var(--bg-gradient);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                }

                .desktop-icons-area.blurred,
                .productivity-dashboard.blurred,
                .minimized-dock.blurred {
                    filter: blur(8px);
                    pointer-events: none;
                    transition: filter 0.3s ease;
                }

                .desktop-icons-area,
                .productivity-dashboard,
                .minimized-dock {
                    transition: filter 0.3s ease;
                }

                .desktop-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: 
                        radial-gradient(circle at 20% 30%, rgba(73, 136, 196, 0.04) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(73, 136, 196, 0.04) 0%, transparent 50%);
                    pointer-events: none;
                }

                .desktop-icons-area {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 16px 24px 12px;
                    align-content: flex-start;
                    flex-shrink: 0;
                }

                /* Productivity Dashboard */
                .productivity-dashboard {
                    padding: 0 24px 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-height: 0;
                }

                .stats-row {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    flex-shrink: 0;
                }

                /* Dashboard Style Stat Cards */
                .dash-stat-card {
                    flex: 1;
                    min-width: 160px;
                    background: var(--card-bg);
                    border-radius: 10px;
                    padding: 14px 18px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    border: 1px solid var(--border-color);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .dash-stat-card:hover {
                    background: var(--card-elevated);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                }

                .dash-stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .dash-stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .dash-stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-color);
                    line-height: 1.2;
                }

                .dash-stat-label {
                    font-size: 12px;
                    color: var(--text-color);
                    opacity: 0.5;
                    margin-top: 1px;
                }

                .dashboard-widgets {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 16px;
                    flex: 1;
                    min-height: 0;
                    overflow: hidden;
                }

                .widget {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 16px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-height: 0;
                }
                
                .widget:hover {
                    border-color: rgba(73, 136, 196, 0.15);
                }

                .widget h3 {
                    margin: 0 0 12px 0;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-color);
                    flex-shrink: 0;
                }

                /* Quick Actions Widget */
                .widget.quick-actions,
                .widget.recent-tasks,
                .widget.category-overview {
                    height: fit-content;
                }

                .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: var(--card-elevated);
                    border: 1px solid var(--border-color);
                    border-radius: 10px;
                    color: var(--text-color);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .action-btn:hover {
                    background: #4a4a4a;
                    border-color: rgba(73, 136, 196, 0.3);
                    transform: translateY(-1px);
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, #4988C4 0%, #3a7ab8 100%);
                    border-color: #4988C4;
                    color: white;
                }

                .action-btn.primary:hover {
                    background: linear-gradient(135deg, #5a9ad4 0%, #4988C4 100%);
                    box-shadow: 0 4px 15px rgba(73, 136, 196, 0.35);
                }

                /* Recent Tasks Widget */
                .recent-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex: 1;
                    overflow-y: auto;
                    min-height: 0;
                }

                .recent-task-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 14px;
                    background: var(--card-elevated);
                    border-radius: 10px;
                    transition: all 0.15s;
                }

                .recent-task-item:hover {
                    background: rgba(0, 0, 0, 0.3);
                }

                .priority-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .priority-dot.p0 { background: #2ecc71; }
                .priority-dot.p1 { background: #ffa502; }
                .priority-dot.p2 { background: #ff4d4d; }

                .recent-task-title {
                    flex: 1;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-color);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .recent-task-category {
                    font-size: 11px;
                    color: var(--text-color);
                    opacity: 0.5;
                    background: var(--nav-hover-bg);
                    padding: 3px 8px;
                    border-radius: 6px;
                }

                .no-tasks-msg {
                    text-align: center;
                    padding: 20px;
                    font-size: 13px;
                    color: var(--text-color);
                    opacity: 0.6;
                }

                /* Category Overview Widget */
                .category-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .category-bar-item {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .bar-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: var(--text-color);
                }

                .bar-label span:first-child {
                    font-weight: 500;
                }

                .bar-label span:last-child {
                    opacity: 0.6;
                }

                .bar-track {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }

                .bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }

                .desktop-icon.add-icon {
                    opacity: 0.5;
                    transition: all 0.2s;
                }

                .desktop-icon.add-icon:hover {
                    opacity: 1;
                }

                .desktop-icon.add-icon .desktop-icon-image.add {
                    border: 2px dashed var(--border-color);
                    background: transparent;
                }

                .minimized-dock {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 8px;
                    padding: 8px 16px;
                    background: var(--card-bg);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 16px;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--glass-shadow);
                }

                .dock-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--card-elevated);
                    border: none;
                    border-radius: 10px;
                    color: var(--text-color);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 13px;
                }

                .dock-item:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .dock-icon {
                    font-size: 18px;
                }

                .dock-label {
                    font-weight: 500;
                }

                .desktop-fab-container {
                    position: absolute;
                    bottom: 30px;
                    right: 30px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .desktop-fab {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .desktop-fab.primary {
                    background: var(--primary-color);
                    color: white;
                }

                .desktop-fab:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 30px rgba(var(--primary-rgb), 0.4);
                }

                .context-menu {
                    position: fixed;
                    background: rgba(28, 28, 32, 0.95);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 14px;
                    padding: 6px;
                    min-width: 200px;
                    box-shadow: 
                        0 20px 50px -12px rgba(0, 0, 0, 0.6),
                        0 0 0 1px rgba(255, 255, 255, 0.06),
                        inset 0 1px 0 rgba(255, 255, 255, 0.04);
                    z-index: 10000;
                    animation: menu-fade 0.18s cubic-bezier(0.2, 0, 0, 1);
                    transform-origin: top left;
                }

                @keyframes menu-fade {
                    from { opacity: 0; transform: scale(0.92) translateY(-4px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .context-menu-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px 8px;
                }

                .context-menu-icon {
                    font-size: 18px;
                }

                .context-menu-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--text-color);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }

                .context-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    padding: 10px 12px;
                    border: none;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: left;
                    border-radius: 8px;
                }

                .context-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                }

                .context-btn-icon {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .context-btn-icon.open {
                    background: rgba(73, 136, 196, 0.2);
                    color: #4988C4;
                }

                .context-btn-icon.add {
                    background: rgba(74, 222, 128, 0.2);
                    color: #4ade80;
                    font-size: 16px;
                }

                .context-btn-icon.complete {
                    background: rgba(74, 222, 128, 0.2);
                    color: #4ade80;
                }

                .context-btn-icon.delete {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }

                .context-btn.danger {
                    color: rgba(239, 68, 68, 0.9);
                }

                .context-btn.danger:hover {
                    background: rgba(239, 68, 68, 0.12);
                    color: #ef4444;
                }

                .context-divider {
                    height: 1px;
                    background: rgba(255, 255, 255, 0.06);
                    margin: 4px 8px;
                }

                .icon-selector {
                    display: flex;
                    gap: 10px;
                }

                .selected-icon-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: var(--text-color);
                }

                .selected-icon-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--primary-color);
                }

                .icon-preview {
                    font-size: 28px;
                }

                .change-text {
                    font-size: 14px;
                    opacity: 0.7;
                }

                .anime-input {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    background: var(--input-bg);
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                
                .anime-input:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    background: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.15);
                }

                .anime-input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                /* Fix for date input in dark mode */
                input[type="datetime-local"] {
                    color-scheme: dark;
                }

                /* ===== MOBILE TASKS STYLES ===== */
                .mobile-tasks-container {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    padding: 16px;
                    height: 100%;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .mobile-stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }

                .mobile-stat {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 12px 8px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .mobile-stat-val {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                }

                .mobile-stat-lbl {
                    font-size: 0.65rem;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 600;
                }

                .mobile-quick-actions {
                    display: flex;
                    gap: 8px;
                }

                .mobile-action-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 12px 10px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--card-bg);
                    color: var(--text-color);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .mobile-action-btn.primary {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .mobile-action-btn:active {
                    transform: scale(0.97);
                }

                .mobile-section-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    color: var(--text-muted);
                    font-weight: 700;
                    margin-top: 4px;
                }

                .mobile-category-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .mobile-category-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .mobile-category-item:active {
                    transform: scale(0.98);
                    background: var(--card-elevated);
                }

                .mobile-focus-section {
                    background: linear-gradient(135deg, rgba(73, 136, 196, 0.15), rgba(52, 152, 219, 0.08));
                    border-color: rgba(73, 136, 196, 0.25);
                }

                .mobile-cat-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .mobile-cat-icon {
                    font-size: 1.4rem;
                    width: 36px;
                    text-align: center;
                }

                .mobile-cat-info {
                    display: flex;
                    flex-direction: column;
                }

                .mobile-cat-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--text-color);
                }

                .mobile-cat-total {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .mobile-cat-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted);
                }

                .mobile-cat-count {
                    background: var(--primary-color);
                    color: white;
                    font-size: 0.7rem;
                    font-weight: 700;
                    min-width: 22px;
                    height: 22px;
                    border-radius: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 6px;
                }

                /* Mobile Category Detail Sheet */
                .mobile-category-sheet {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: var(--bg-gradient);
                    z-index: 9998;
                    display: flex;
                    flex-direction: column;
                    animation: slideInRight 0.25s cubic-bezier(0.32, 0.72, 0, 1);
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }

                .mobile-sheet-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border-bottom: 1px solid var(--border-color);
                    background: var(--card-bg);
                }

                .mobile-back-btn {
                    background: none;
                    border: none;
                    color: var(--text-color);
                    padding: 8px;
                    cursor: pointer;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-back-btn:active {
                    background: var(--nav-hover-bg);
                }

                .mobile-sheet-title {
                    flex: 1;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-color);
                    margin: 0;
                }

                .mobile-add-task-btn {
                    background: var(--primary-color);
                    border: none;
                    color: white;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mobile-view-pills {
                    display: flex;
                    gap: 6px;
                    padding: 12px 16px;
                    overflow-x: auto;
                }

                .mobile-view-pill {
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    background: transparent;
                    color: var(--text-muted);
                    font-size: 0.78rem;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.15s;
                }

                .mobile-view-pill.active {
                    background: var(--primary-color);
                    color: white;
                    border-color: var(--primary-color);
                }

                .mobile-sheet-content {
                    flex: 1;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                /* Override TaskWindow for mobile embedded mode */
                .mobile-sheet-content .task-window {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                    backdrop-filter: none !important;
                }

                .mobile-sheet-content .window-header {
                    display: none !important;
                }

                .mobile-sheet-content .window-resize-handle {
                    display: none !important;
                }

                .mobile-sheet-content .kanban-view {
                    display: flex !important;
                    overflow-x: auto;
                    gap: 12px;
                    padding-bottom: 16px;
                }

                .mobile-sheet-content .kanban-column {
                    min-width: 80vw;
                    flex-shrink: 0;
                }
            `}</style>
        </div>
    );
};

export default Tasks;
