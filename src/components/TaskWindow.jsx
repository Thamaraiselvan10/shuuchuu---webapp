import React, { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowUp, ArrowDown, Calendar, Flag, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';


const TaskWindow = ({
    id,
    title,
    icon = '📁',
    tasks = [],
    isMinimized,
    isMaximized,
    position = { x: 100, y: 100 },
    size = { width: 700, height: 500 },
    zIndex = 1,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onPositionChange,
    onSizeChange,
    onTaskToggle,
    onTaskDelete,
    onTaskStatusChange,
    onTaskPriorityChange,
    onAddTask,
    onTaskContextMenu,
    isBlurred,
    onToggleBlur,
    allowAddTask = true,
    showCategory = false
}) => {
    const [viewMode, setViewMode] = useState('kanban');
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const windowRef = useRef(null);
    const { settings } = useSettings();

    // DnD Sensors for Kanban
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );

    // Drag handling for window
    const handleMouseDown = (e) => {
        if (e.target.closest('.window-controls') || e.target.closest('.window-content') || e.target.closest('.window-view-modes')) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
        onFocus?.();
    };

    const handleMouseMove = (e) => {
        if (isDragging && !isMaximized) {
            const newX = Math.max(0, e.clientX - dragOffset.x);
            const newY = Math.max(0, e.clientY - dragOffset.y);
            onPositionChange?.(id, { x: newX, y: newY });
        }
        if (isResizing && !isMaximized) {
            const rect = windowRef.current?.getBoundingClientRect();
            if (rect) {
                const newWidth = Math.max(500, e.clientX - rect.left);
                const newHeight = Math.max(400, e.clientY - rect.top);
                onSizeChange?.(id, { width: newWidth, height: newHeight });
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragOffset]);

    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        onFocus?.();
    };

    // Kanban drag-drop handler
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const targetColumn = over.id;

        if (['pending', 'progress', 'completed'].includes(targetColumn)) {
            const task = tasks.find(t => t.id === taskId);
            if (task && task.status !== targetColumn) {
                onTaskStatusChange?.(taskId, targetColumn);
            }
        }
    };

    if (isMinimized) return null;

    // Group tasks by status for Kanban view
    const tasksByStatus = {
        pending: tasks.filter(t => t.status === 'pending'),
        progress: tasks.filter(t => t.status === 'progress'),
        completed: tasks.filter(t => t.status === 'completed')
    };

    // Group tasks by priority for Priority view
    const tasksByPriority = {
        high: tasks.filter(t => t.priority === 2),
        medium: tasks.filter(t => t.priority === 1),
        low: tasks.filter(t => t.priority === 0)
    };

    // Group tasks by deadline for Deadline view
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const tasksByDeadline = {
        overdue: tasks.filter(t => t.due_at && new Date(t.due_at) < today && t.status !== 'completed'),
        today: tasks.filter(t => {
            if (!t.due_at) return false;
            const due = new Date(t.due_at);
            return due.toDateString() === today.toDateString();
        }),
        thisWeek: tasks.filter(t => {
            if (!t.due_at) return false;
            const due = new Date(t.due_at);
            return due > today && due <= weekEnd;
        }),
        later: tasks.filter(t => {
            if (!t.due_at) return false;
            const due = new Date(t.due_at);
            return due > weekEnd;
        }),
        noDue: tasks.filter(t => !t.due_at)
    };

    const windowStyle = isMaximized
        ? {
            top: 80,  // Below header (header ~70px)
            left: 20,
            width: 'calc(100vw - 40px)',
            height: 'calc(100vh - 160px)',  // Leave space for header and dock
            zIndex,
            borderRadius: 12
        }
        : {
            top: position.y,
            left: position.x,
            width: size.width,
            height: size.height,
            zIndex
        };

    return (
        <div
            ref={windowRef}
            className={`task-window ${isMaximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''}`}
            style={windowStyle}
            onClick={() => onFocus?.()}
        >
            <div className="window-header" onMouseDown={handleMouseDown}>
                <div className="window-controls">
                    <button className="window-btn close" onClick={() => onClose?.(id)} title="Close">
                        <span>×</span>
                    </button>
                    <button className="window-btn minimize" onClick={() => onMinimize?.(id)} title="Minimize">
                        <span>−</span>
                    </button>
                    <button className="window-btn maximize" onClick={() => onMaximize?.(id)} title={isMaximized ? "Restore" : "Maximize"}>
                        <span>{isMaximized ? '❐' : '□'}</span>
                    </button>
                </div>
                <div className="window-title">
                    <span className="window-icon">{icon}</span>
                    <span>{title}</span>
                    <span className="window-task-count">{tasks.filter(t => t.status !== 'completed').length}</span>
                </div>
                <div className="window-view-modes" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        className="blur-toggle-btn"
                        onClick={onToggleBlur}
                        title={isBlurred ? "Disable Focus Mode" : "Enable Focus Mode (Blur Background)"}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: isBlurred ? 'var(--primary-color)' : 'var(--text-color)',
                            cursor: 'pointer',
                            padding: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isBlurred ? 1 : 0.7,
                            transition: 'all 0.2s ease',
                            borderRadius: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.opacity = isBlurred ? '1' : '0.7';
                        }}
                    >
                        {isBlurred ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <select
                        className="view-mode-dropdown"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                    >
                        <option value="kanban">Kanban</option>
                        <option value="cards">Cards</option>
                        <option value="tiles">List</option>
                        <option value="deadline">Deadline</option>
                    </select>
                </div>
                {allowAddTask && (
                    <button
                        className="window-add-task-btn"
                        onClick={() => onAddTask?.(title)}
                        title="Add Task"
                    >
                        <span>+</span> Add Task
                    </button>
                )}
            </div>

            <div className="window-content">
                {tasks.length === 0 ? (
                    <div className="window-empty">
                        <span className="empty-icon">📭</span>
                        <p>No tasks in this category</p>
                    </div>
                ) : (
                    <>
                        {/* Cards View */}
                        {viewMode === 'cards' && (
                            <div className={`cards-grid ${isMaximized ? 'maximized' : ''}`}>
                                {tasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        showCategory={showCategory}
                                        onToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Tiles/List View */}
                        {viewMode === 'tiles' && (
                            <div className={`tiles-list ${isMaximized ? 'maximized' : ''}`}>
                                {tasks.map(task => (
                                    <TaskTile
                                        key={task.id}
                                        task={task}
                                        showCategory={showCategory}
                                        onToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Kanban View with Drag & Drop */}
                        {viewMode === 'kanban' && (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <div className={`kanban-view ${isMaximized ? 'maximized' : ''}`}>
                                    <DroppableKanbanColumn
                                        id="pending"
                                        title="To Do"
                                        tasks={tasksByStatus.pending}
                                        showCategory={showCategory}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                    <DroppableKanbanColumn
                                        id="progress"
                                        title="In Progress"
                                        tasks={tasksByStatus.progress}
                                        showCategory={showCategory}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                    <DroppableKanbanColumn
                                        id="completed"
                                        title={
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Done
                                                {(settings?.autoDeleteDoneTasks ?? true) && (
                                                    <span 
                                                        title={`Auto-deletes in ${settings?.autoDeleteDoneTasksHours || 1} hour(s)`} 
                                                        style={{ opacity: 0.6, display: 'flex', alignItems: 'center', cursor: 'help' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </span>
                                                )}
                                            </span>
                                        }
                                        tasks={tasksByStatus.completed}
                                        showCategory={showCategory}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                </div>
                            </DndContext>
                        )}

                        {/* Priority View */}
                        {viewMode === 'priority' && (
                            <div className="priority-view">
                                <PriorityColumn
                                    title="High Priority"
                                    tasks={tasksByPriority.high}
                                    priority={2}
                                    color="#dc3545"
                                    onTaskToggle={onTaskToggle}
                                    onContextMenu={onTaskContextMenu}
                                    onPriorityChange={onTaskPriorityChange}
                                />
                                <PriorityColumn
                                    title="Medium Priority"
                                    tasks={tasksByPriority.medium}
                                    priority={1}
                                    color="#4988C4"
                                    onTaskToggle={onTaskToggle}
                                    onContextMenu={onTaskContextMenu}
                                    onPriorityChange={onTaskPriorityChange}
                                />
                                <PriorityColumn
                                    title="Low Priority"
                                    tasks={tasksByPriority.low}
                                    priority={0}
                                    color="#28a745"
                                    onTaskToggle={onTaskToggle}
                                    onContextMenu={onTaskContextMenu}
                                    onPriorityChange={onTaskPriorityChange}
                                />
                            </div>
                        )}

                        {/* Deadline View */}
                        {viewMode === 'deadline' && (
                            <div className={`deadline-view ${isMaximized ? 'maximized' : ''}`}>
                                {tasksByDeadline.overdue.length > 0 && (
                                    <DeadlineSection
                                        title="⚠️ Overdue"
                                        tasks={tasksByDeadline.overdue}
                                        color="#ff4d4d"
                                        onTaskToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                )}
                                {tasksByDeadline.today.length > 0 && (
                                    <DeadlineSection
                                        title="📌 Today"
                                        tasks={tasksByDeadline.today}
                                        color="#ffa502"
                                        onTaskToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                )}
                                {tasksByDeadline.thisWeek.length > 0 && (
                                    <DeadlineSection
                                        title="📅 This Week"
                                        tasks={tasksByDeadline.thisWeek}
                                        color="#3498db"
                                        onTaskToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                )}
                                {tasksByDeadline.later.length > 0 && (
                                    <DeadlineSection
                                        title="🗓️ Later"
                                        tasks={tasksByDeadline.later}
                                        color="#2ecc71"
                                        onTaskToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                )}
                                {tasksByDeadline.noDue.length > 0 && (
                                    <DeadlineSection
                                        title="📭 No Due Date"
                                        tasks={tasksByDeadline.noDue}
                                        color="#888"
                                        onTaskToggle={onTaskToggle}
                                        onContextMenu={onTaskContextMenu}
                                        isMaximized={isMaximized}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {!isMaximized && (
                <div
                    className="window-resize-handle"
                    onMouseDown={handleResizeStart}
                />
            )}

            <style>{`
                .task-window {
                    position: fixed;
                    background: rgba(30, 30, 30, 0.85);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border-radius: 14px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 
                        0 24px 80px -12px rgba(0, 0, 0, 0.5),
                        0 0 1px rgba(255, 255, 255, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.04);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: box-shadow 0.25s ease, transform 0.2s ease;
                    z-index: 1000;
                }

                .task-window.maximized {
                    box-shadow: 
                        0 30px 100px -20px rgba(0, 0, 0, 0.6),
                        0 0 1px rgba(255, 255, 255, 0.1);
                }

                .task-window.dragging {
                    cursor: grabbing;
                    box-shadow: 
                        0 40px 100px -15px rgba(0, 0, 0, 0.65),
                        0 0 1px rgba(255, 255, 255, 0.15);
                    transform: scale(1.01);
                }

                .window-header {
                    display: flex;
                    align-items: center;
                    padding: 10px 14px;
                    background: rgba(0, 0, 0, 0.25);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    cursor: grab;
                    gap: 14px;
                    user-select: none;
                    flex-shrink: 0;
                }

                .window-controls {
                    display: flex;
                    gap: 8px;
                }

                .window-btn {
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                    font-size: 9px;
                    color: transparent;
                    font-weight: bold;
                }

                .window-btn:hover {
                    color: rgba(0, 0, 0, 0.7);
                }

                .window-btn.close {
                    background: #ff5f57;
                }

                .window-btn.minimize {
                    background: #ffbd2e;
                }

                .window-btn.maximize {
                    background: #28ca41;
                }

                .window-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-color);
                    flex: 1;
                }

                .window-icon {
                    font-size: 16px;
                }

                .window-task-count {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 600;
                }

                .window-view-modes {
                    display: flex;
                    align-items: center;
                }

                .view-mode-dropdown {
                    padding: 8px 32px 8px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-color);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    outline: none;
                    transition: all 0.2s ease;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239e9e9e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                }

                .view-mode-dropdown:hover {
                    border-color: rgba(73, 136, 196, 0.4);
                    background-color: #4a4a4a;
                }

                .view-mode-dropdown:focus {
                    border-color: #4988C4;
                    box-shadow: 0 0 0 2px rgba(73, 136, 196, 0.2);
                }

                .view-mode-dropdown option {
                    background: var(--card-bg);
                    color: var(--text-color);
                    padding: 8px;
                }

                .window-add-task-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: linear-gradient(135deg, #4988C4 0%, #3a7ab8 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-left: 10px;
                }

                .window-add-task-btn:hover {
                    background: linear-gradient(135deg, #5a9ad4 0%, #4988C4 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(73, 136, 196, 0.35);
                }

                .window-add-task-btn span {
                    font-size: 16px;
                    font-weight: bold;
                }

                .window-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 16px;
                }

                .window-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .window-resize-handle {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 20px;
                    height: 20px;
                    cursor: nwse-resize;
                    background: linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%);
                    border-radius: 0 0 12px 0;
                }

                /* Cards Grid - Minimal List Style */
                .cards-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                /* Maximized mode - use responsive grid */
                .cards-grid.maximized {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 12px;
                    align-content: start;
                }

                /* Tiles List */
                .tiles-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                /* Tiles List - Maximized 2 columns */
                .tiles-list.maximized {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                /* Kanban View */
                .kanban-view {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    height: 100%;
                    min-height: 300px;
                }

                /* Priority View */
                .priority-view {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    height: 100%;
                    min-height: 300px;
                }

                /* Deadline View */
                .deadline-view {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                /* Deadline View - Maximized uses 2 column grid for tasks */
                .deadline-view.maximized .deadline-tasks {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
            `}</style>
        </div>
    );
};

// Minimal Task Card Component - Compact for tasks without description
const TaskCard = ({ task, showCategory, onToggle, onContextMenu, isMaximized }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'completed';
    const priorityColors = ['#4ade80', '#fbbf24', '#ef4444'];
    const priorityLabels = ['Low', 'Medium', 'High'];
    const hasDescription = task.description && task.description.trim();
    const isCompleted = task.status === 'completed';

    return (
        <div
            className={`task-card ${isCompleted ? 'completed' : ''} ${hasDescription ? '' : 'compact'} ${isMaximized ? 'maximized' : ''}`}
            onClick={() => onToggle?.(task.id, task.status)}
            onContextMenu={(e) => onContextMenu?.(e, task)}
        >
            <div className="task-card-main">
                <div className="task-card-left">
                    <span
                        className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                        style={{ borderColor: isCompleted ? priorityColors[task.priority] : 'rgba(255,255,255,0.2)' }}
                    >
                        {isCompleted && '✓'}
                    </span>
                    <div className="task-card-info">
                        <span className="task-card-title">{task.title}</span>
                        {hasDescription && (
                            <span className="task-card-desc">{task.description}</span>
                        )}
                    </div>
                </div>
                <div className="task-card-right">
                    <span
                        className="task-priority-indicator"
                        style={{ background: priorityColors[task.priority] }}
                    />
                    {task.due_at && (
                        <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
                            {formatDate(task.due_at)}
                        </span>
                    )}
                    {isMaximized && (
                        <span
                            className="task-priority-label"
                            style={{ color: priorityColors[task.priority] }}
                        >
                            {priorityLabels[task.priority]}
                        </span>
                    )}
                </div>
            </div>

            <style>{`
                .task-card {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 10px;
                    padding: 14px 16px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .task-card:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(73, 136, 196, 0.2);
                    transform: translateY(-1px);
                }

                .task-card.completed {
                    opacity: 0.5;
                }

                .task-card.compact {
                    padding: 12px 16px;
                }

                /* Maximized mode styles */
                .task-card.maximized {
                    padding: 18px 20px;
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 12px;
                }

                .task-card.maximized.compact {
                    padding: 16px 20px;
                }

                .task-card.maximized:hover {
                    background: rgba(255, 255, 255, 0.07);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
                }

                .task-card-main {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }

                .task-card-left {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    flex: 1;
                    min-width: 0;
                }

                .task-checkbox {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: transparent;
                    flex-shrink: 0;
                    margin-top: 2px;
                    transition: all 0.2s;
                }

                .task-checkbox.checked {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    color: white;
                }

                .task-card:hover .task-checkbox:not(.checked) {
                    border-color: var(--primary-color);
                }

                .task-card-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                    flex: 1;
                }

                .task-card-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-color);
                    line-height: 1.3;
                    word-break: break-word;
                }

                .task-card.maximized .task-card-title {
                    font-size: 15px;
                    font-weight: 600;
                }

                .task-card.completed .task-card-title {
                    text-decoration: line-through;
                }

                .task-card-desc {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.45);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .task-card-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-shrink: 0;
                }

                .task-card.maximized .task-card-right {
                    gap: 12px;
                }

                .task-priority-indicator {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .task-priority-label {
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    background: rgba(0, 0, 0, 0.25);
                }

                .task-card-due {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.4);
                }

                .task-card-due.overdue {
                    color: #ef4444;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

// Task Tile Component (List View)
const TaskTile = ({ task, showCategory, onToggle, onContextMenu }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = task.due_at && new Date(task.due_at) < new Date() && task.status !== 'completed';
    const priorityLabels = ['Low', 'Med', 'High'];
    const priorityColors = ['#2ecc71', '#ffa502', '#ff4d4d'];

    return (
        <div
            className={`task-tile ${task.status === 'completed' ? 'completed' : ''}`}
            onContextMenu={(e) => onContextMenu?.(e, task)}
        >
            <label className="tile-checkbox-container">
                <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => onToggle?.(task.id, task.status)}
                />
                <span className="tile-checkmark"></span>
            </label>
            <span className="tile-title">{task.title}</span>
            <span
                className="tile-priority"
                style={{ background: `${priorityColors[task.priority]}22`, color: priorityColors[task.priority] }}
            >
                {priorityLabels[task.priority]}
            </span>
            {task.due_at && (
                <span className={`tile-due ${isOverdue ? 'overdue' : ''}`}>
                    {formatDate(task.due_at)}
                </span>
            )}
            {showCategory && task.category && (
                <span className="tile-category-tag" style={{
                    fontSize: '10px',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    color: '#aaa',
                    marginLeft: '8px'
                }}>
                    {task.category}
                </span>
            )}

            <style>{`
                .task-tile {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    background: var(--card-elevated);
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    transition: all 0.15s;
                }

                .task-tile:hover {
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(var(--primary-rgb), 0.2);
                }

                .task-tile.completed {
                    opacity: 0.5;
                }

                .tile-checkbox-container {
                    display: flex;
                    cursor: pointer;
                }

                .tile-checkbox-container input {
                    display: none;
                }

                .tile-checkmark {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .tile-checkbox-container input:checked + .tile-checkmark {
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                }

                .tile-checkbox-container input:checked + .tile-checkmark::after {
                    content: '✓';
                    color: white;
                    font-size: 11px;
                }

                .tile-title {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-color);
                }

                .task-tile.completed .tile-title {
                    text-decoration: line-through;
                }

                .tile-priority {
                    font-size: 10px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 12px;
                    text-transform: uppercase;
                }

                .tile-due {
                    font-size: 12px;
                    color: var(--text-color);
                    opacity: 0.6;
                }

                .tile-due.overdue {
                    color: #ff4d4d;
                    opacity: 1;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
};

// Droppable Kanban Column Component
const DroppableKanbanColumn = ({ id, title, tasks, showCategory, onContextMenu, isMaximized }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`kanban-column ${id} ${isOver ? 'drag-over' : ''}`}
        >
            <div className="column-header">
                <span>{title}</span>
                <span className="column-count">{tasks.length}</span>
            </div>
            <div className="column-content">
                {tasks.map(task => (
                    <DraggableKanbanCard
                        key={task.id}
                        task={task}
                        showCategory={showCategory}
                        onContextMenu={onContextMenu}
                        isMaximized={isMaximized}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="column-empty">
                        <span>Drop tasks here</span>
                    </div>
                )}
            </div>

            <style>{`
                .kanban-column {
                    background: var(--card-bg);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    min-height: 0; /* Allow shrinking for flex container */
                }

                .kanban-column.drag-over {
                    background: rgba(73, 136, 196, 0.08);
                    border-color: #4988C4;
                    box-shadow: 0 0 20px rgba(73, 136, 196, 0.15);
                }

                .kanban-column.pending { }
                .kanban-column.progress { }
                .kanban-column.completed { }

                .column-header {
                    padding: 14px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--header-bg);
                    font-weight: 600;
                    font-size: 13px;
                    color: var(--text-color);
                    border-bottom: 1px solid var(--border-color);
                    flex-shrink: 0;
                }

                .column-count {
                    background: rgba(73, 136, 196, 0.15);
                    color: #4988C4;
                    padding: 3px 10px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 600;
                }

                .column-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    min-height: 200px;
                }

                .column-empty {
                    text-align: center;
                    padding: 30px 10px;
                    opacity: 0.3;
                    font-style: italic;
                    font-size: 13px;
                    border: 2px dashed rgba(255, 255, 255, 0.08);
                    border-radius: 10px;
                    margin: 10px 0;
                    color: #9e9e9e;
                }
            `}</style>
        </div>
    );
};

// Draggable Kanban Card Component - Minimal Design
const DraggableKanbanCard = ({ task, showCategory, onContextMenu, isMaximized }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
    };

    const priorityColors = ['#4ade80', '#fbbf24', '#ef4444'];
    const priorityLabels = ['Low', 'Medium', 'High'];
    const hasDescription = task.description && task.description.trim();
    const hasDue = task.due_at;
    const hasFooter = hasDue || isMaximized;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`draggable-kanban-card ${isDragging ? 'dragging' : ''} ${hasDescription || hasFooter ? '' : 'compact'} ${isMaximized ? 'maximized' : ''}`}
            {...listeners}
            {...attributes}
            onContextMenu={(e) => onContextMenu?.(e, task)}
        >
            <div className="kanban-card-content">
                <div className="kanban-card-header">
                    <span className="kanban-priority-dot" style={{ background: priorityColors[task.priority] }} />
                    <div className="kanban-card-info">
                        {showCategory && task.category && (
                            <span className="kanban-category-tag">
                                {task.category}
                            </span>
                        )}
                        <span className="kanban-card-title">{task.title}</span>
                    </div>
                    <span className="drag-indicator">⋮⋮</span>
                </div>
                {hasDescription && (
                    <div className="kanban-card-desc">
                        {task.description.length > 50 ? task.description.substring(0, 50) + '...' : task.description}
                    </div>
                )}
                {hasFooter && (
                    <div className="kanban-card-footer">
                        {task.due_at && (
                            <span className="kanban-due">
                                {new Date(task.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .draggable-kanban-card {
                    background: rgba(255, 255, 255, 0.04);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    cursor: grab;
                    transition: all 0.2s ease;
                    touch-action: none;
                    flex-shrink: 0;
                }

                .draggable-kanban-card.compact {
                    background: rgba(255, 255, 255, 0.03);
                }

                .draggable-kanban-card:hover {
                    background: rgba(255, 255, 255, 0.07);
                    border-color: rgba(73, 136, 196, 0.2);
                }

                .draggable-kanban-card.dragging {
                    cursor: grabbing;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                }

                .kanban-card-content {
                    padding: 12px 14px;
                }

                .draggable-kanban-card.compact .kanban-card-content {
                    padding: 10px 12px;
                }

                .kanban-card-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }

                .kanban-priority-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    margin-top: 6px;
                }

                .kanban-card-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                    min-width: 0;
                }

                .kanban-category-tag {
                    font-size: 9px;
                    color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.06);
                    padding: 2px 6px;
                    border-radius: 3px;
                    align-self: flex-start;
                }

                .drag-indicator {
                    opacity: 0;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.3);
                    flex-shrink: 0;
                    transition: opacity 0.15s;
                }

                .draggable-kanban-card:hover .drag-indicator {
                    opacity: 1;
                }

                .kanban-card-title {
                    font-size: 13px;
                    font-weight: 500;
                    line-height: 1.35;
                    color: var(--text-color);
                    word-break: break-word;
                }

                .kanban-card-desc {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.4);
                    margin-top: 6px;
                    margin-left: 16px;
                    line-height: 1.4;
                }

                .kanban-card-footer {
                    margin-top: 8px;
                    margin-left: 16px;
                }

                .kanban-due {
                    font-size: 10px;
                    color: rgba(255, 255, 255, 0.35);
                }

                /* Maximized mode styles for Kanban cards */
                .draggable-kanban-card.maximized {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }

                .draggable-kanban-card.maximized .kanban-card-content {
                    padding: 16px 18px;
                }

                .draggable-kanban-card.maximized:hover {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                }

                .draggable-kanban-card.maximized .kanban-card-title {
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 1.4;
                }

                .draggable-kanban-card.maximized .kanban-card-desc {
                    font-size: 12px;
                    margin-top: 8px;
                    -webkit-line-clamp: 3;
                }

                .draggable-kanban-card.maximized .kanban-card-footer {
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .draggable-kanban-card.maximized .kanban-priority-dot {
                    width: 8px;
                    height: 8px;
                    margin-top: 5px;
                }
            `}</style>
        </div >
    );
};

// Priority Column Component
const PriorityColumn = ({ title, tasks, priority, color, onTaskToggle, onContextMenu, onPriorityChange }) => {
    return (
        <div className="priority-column" style={{ borderTopColor: color }}>
            <div className="column-header">
                <span>{title}</span>
                <span className="column-count">{tasks.length}</span>
            </div>
            <div className="column-content">
                {tasks.map(task => (
                    <div
                        key={task.id}
                        className={`priority-card ${task.status}`}
                        onContextMenu={(e) => onContextMenu?.(e, task)}
                    >
                        <div className="priority-card-header">
                            <label className="priority-checkbox">
                                <input
                                    type="checkbox"
                                    checked={task.status === 'completed'}
                                    onChange={() => onTaskToggle?.(task.id, task.status)}
                                />
                                <span className="checkmark"></span>
                            </label>
                            <span className={task.status === 'completed' ? 'done' : ''}>{task.title}</span>
                        </div>
                        <div className="priority-card-actions">
                            {priority < 2 && (
                                <button
                                    onClick={() => onPriorityChange?.(task.id, priority + 1)}
                                    title="Move to higher priority"
                                >↑</button>
                            )}
                            {priority > 0 && (
                                <button
                                    onClick={() => onPriorityChange?.(task.id, priority - 1)}
                                    title="Move to lower priority"
                                >↓</button>
                            )}
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <div className="column-empty">No tasks</div>}
            </div>

            <style>{`
                .priority-column {
                    background: var(--card-bg);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    border-top: 3px solid;
                }

                .priority-card {
                    background: var(--card-elevated);
                    border-radius: 10px;
                    padding: 12px;
                    border: 1px solid var(--border-color);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .priority-card:hover {
                    background: #3c3c3c;
                    border-color: rgba(73, 136, 196, 0.2);
                }

                .priority-card.completed {
                    opacity: 0.5;
                }

                .priority-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 13px;
                    color: var(--text-color);
                }

                .priority-checkbox {
                    display: flex;
                    cursor: pointer;
                }

                .priority-checkbox input {
                    display: none;
                }

                .priority-checkbox .checkmark {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-radius: 5px;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .priority-checkbox .checkmark::after {
                    content: '✓';
                    font-size: 11px;
                    color: transparent;
                    transition: color 0.2s;
                }

                .priority-checkbox input:checked + .checkmark {
                    background: linear-gradient(135deg, #4988C4 0%, #3a7ab8 100%);
                    border-color: #4988C4;
                    box-shadow: 0 2px 8px rgba(73, 136, 196, 0.35);
                }

                .priority-checkbox input:checked + .checkmark::after {
                    color: white;
                }

                .priority-card:hover .priority-checkbox .checkmark {
                    border-color: #4988C4;
                }

                .priority-card-header .done {
                    text-decoration: line-through;
                    color: #9e9e9e;
                }

                .priority-card-actions {
                    display: flex;
                    gap: 6px;
                    margin-top: 10px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .priority-card:hover .priority-card-actions {
                    opacity: 1;
                }

                .priority-card-actions button {
                    padding: 5px 12px;
                    border: none;
                    border-radius: 6px;
                    background: rgba(255, 255, 255, 0.06);
                    color: #9e9e9e;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .priority-card-actions button:hover {
                    background: #4988C4;
                    color: white;
                }
            `}</style>
        </div>
    );
};

// Deadline Section Component
const DeadlineSection = ({ title, tasks, color, onTaskToggle, onContextMenu }) => {
    return (
        <div className="deadline-section">
            <div className="deadline-header" style={{ borderLeftColor: color }}>
                <span>{title}</span>
                <span className="deadline-count">{tasks.length}</span>
            </div>
            <div className="deadline-tasks">
                {tasks.map(task => (
                    <TaskTile
                        key={task.id}
                        task={task}
                        onToggle={onTaskToggle}
                        onContextMenu={onContextMenu}
                    />
                ))}
            </div>

            <style>{`
                .deadline-section {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .deadline-header {
                    padding: 14px 18px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 14px;
                    border-left: 4px solid;
                    background: rgba(255, 255, 255, 0.03);
                }

                .deadline-count {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 3px 12px;
                    border-radius: 10px;
                    font-size: 12px;
                }

                .deadline-tasks {
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
            `}</style>
        </div>
    );
};

export default TaskWindow;
