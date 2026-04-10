import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, addWeeks, subWeeks } from 'date-fns';
import { useTasks } from '../context/TasksContext';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { indianHolidays } from '../data/indianHolidays';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
    const { tasks, addTask, deleteTask, updateTask } = useTasks();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventCategory, setNewEventCategory] = useState('Event');

    // Category colors for events
    const categoryColors = {
        'Event': '#8b5cf6',
        'Work': '#3b82f6',
        'Personal': '#2ecc71',
        'Health': '#f59e0b',
        'Learning': '#ec4899',
        'Meeting': '#06b6d4',
        'Deadline': '#ef4444'
    };

    const categories = Object.keys(categoryColors);

    const nextPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    const prevPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const onDateClick = (day) => {
        setSelectedDate(day);
        setIsPopupOpen(true);
        setNewEventTitle('');
        setNewEventCategory('Event');
    };

    const handleCreateEvent = async () => {
        if (!newEventTitle.trim()) return;

        const newTask = {
            title: newEventTitle,
            due_at: selectedDate.toISOString(),
            category: newEventCategory,
            priority: 1
        };

        try {
            await addTask(newTask);
            setNewEventTitle('');
        } catch (err) {
            console.error('Failed to create event', err);
        }
    };

    const handleDeleteEvent = async (taskId) => {
        try {
            await deleteTask(taskId);
        } catch (err) {
            console.error('Failed to delete event', err);
        }
    };

    // Calculate calendar days based on view mode
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = viewMode === 'month'
        ? startOfWeek(monthStart)
        : startOfWeek(currentDate);
    const endDate = viewMode === 'month'
        ? endOfWeek(monthEnd)
        : endOfWeek(currentDate);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Filter tasks for the selected date popup
    const selectedDateTasks = tasks.filter(task =>
        task.due_at && isSameDay(new Date(task.due_at), selectedDate)
    );

    return (
        <div className="anime-calendar-container">
            <div className="calendar-header">
                <div className="header-left">
                    <h2 className="month-title">
                        {viewMode === 'month'
                            ? format(currentDate, 'MMMM yyyy')
                            : `Week of ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
                        }
                    </h2>
                </div>
                <div className="header-actions">
                    {/* View Toggle */}
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                            onClick={() => setViewMode('month')}
                        >
                            Month
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </button>
                    </div>
                    <button onClick={prevPeriod} className="nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="today-btn">Today</button>
                    <button onClick={nextPeriod} className="nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            <div className={`calendar-grid ${viewMode === 'week' ? 'week-view' : ''}`}>
                {weekDays.map(day => (
                    <div key={day} className="weekday-header">{day}</div>
                ))}

                {calendarDays.map(day => {
                    const dayTasks = tasks.filter(task =>
                        task.due_at && isSameDay(new Date(task.due_at), day)
                    );

                    const holiday = indianHolidays.find(h => isSameDay(new Date(h.date), day));

                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            className={`calendar-cell ${!isCurrentMonth && viewMode === 'month' ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isDayToday ? 'today' : ''} ${viewMode === 'week' ? 'week-cell' : ''}`}
                            onClick={() => onDateClick(day)}
                        >
                            <div className="cell-header">
                                <span className="day-number">{format(day, 'd')}</span>
                                {holiday && (
                                    <span
                                        className="holiday-indicator"
                                        title={holiday.title}
                                        style={{
                                            fontSize: '0.7em',
                                            color: '#e74c3c',
                                            marginLeft: 'auto',
                                            marginRight: '5px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        ★
                                    </span>
                                )}
                                {viewMode === 'week' && <span className="day-name">{format(day, 'EEE')}</span>}
                            </div>
                            <div className="cell-content">
                                {dayTasks.slice(0, viewMode === 'week' ? 5 : 3).map(task => (
                                    <div
                                        key={task.id}
                                        className={`mini-task-pill ${task.status}`}
                                        title={task.title}
                                        style={{
                                            background: categoryColors[task.category] || '#8b5cf6',
                                            borderLeft: `3px solid ${categoryColors[task.category] || '#8b5cf6'}`
                                        }}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > (viewMode === 'week' ? 5 : 3) && (
                                    <div className="more-tasks">+{dayTasks.length - (viewMode === 'week' ? 5 : 3)} more</div>
                                )}
                                {holiday && (
                                    <div className="holiday-label" style={{
                                        fontSize: '0.7rem',
                                        color: '#e74c3c',
                                        marginTop: 'auto',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                                        borderRadius: '4px',
                                        padding: '2px 4px'
                                    }}>
                                        {holiday.title}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title={format(selectedDate, 'EEEE, MMMM do, yyyy')}
            >
                <div className="event-popup-content">
                    <div className="event-list">
                        {selectedDateTasks.length === 0 ? (
                            <p className="no-events">No events scheduled for this day.</p>
                        ) : (
                            selectedDateTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={`event-item ${task.status}`}
                                    style={{ borderLeftColor: categoryColors[task.category] || '#8b5cf6' }}
                                >
                                    <div className="event-details">
                                        <div className="event-title">{task.title}</div>
                                        <div
                                            className="event-category-badge"
                                            style={{ background: categoryColors[task.category] || '#8b5cf6' }}
                                        >
                                            {task.category}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEvent(task.id)}
                                        className="event-delete-btn"
                                        title="Delete event"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="new-event-form">
                        <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Add New Event</h4>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <Input
                                placeholder="Event title..."
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                style={{ marginBottom: 0, flex: 1 }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <select
                                value={newEventCategory}
                                onChange={(e) => setNewEventCategory(e.target.value)}
                                className="category-select"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <Button onClick={handleCreateEvent}>Add Event</Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <style>{`
                .anime-calendar-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow: hidden;
                    background: var(--card-bg);
                    border-radius: 24px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
                }

                /* Stronger border and shadow specifically for Light Mode */
                [data-theme='light'] .anime-calendar-container {
                    border: 1px solid rgba(0,0,0,0.1);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .month-title {
                    font-size: 2rem;
                    color: var(--primary-color);
                    margin: 0;
                    font-weight: 800;
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.05);
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .nav-btn {
                    background: var(--nav-hover-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-color);
                    transition: all 0.2s ease;
                }

                .nav-btn:hover {
                    background: var(--primary-color);
                    color: white;
                    transform: scale(1.1);
                }

                .today-btn {
                    background: var(--secondary-color);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .today-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }

                /* View Toggle */
                .view-toggle {
                    display: flex;
                    background: var(--nav-hover-bg);
                    border-radius: 20px;
                    padding: 4px;
                    margin-right: 15px;
                }

                .view-btn {
                    padding: 6px 16px;
                    border: none;
                    background: transparent;
                    color: var(--text-color);
                    border-radius: 16px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .view-btn.active {
                    background: var(--primary-color);
                    color: white;
                }

                .view-btn:hover:not(.active) {
                    background: var(--card-elevated);
                }

                /* Week View Styles */
                .calendar-grid.week-view {
                    grid-template-rows: auto 1fr;
                }

                .calendar-cell.week-cell {
                    min-height: 300px;
                }

                .day-name {
                    font-size: 0.7rem;
                    opacity: 0.6;
                    margin-left: 5px;
                }

                /* Category Select */
                .category-select {
                    padding: 10px 15px;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-color);
                    font-size: 0.9rem;
                    outline: none;
                    cursor: pointer;
                }

                .category-select option {
                    background: var(--card-bg);
                    color: var(--text-color);
                }

                /* Event Item Styling */
                .event-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 15px;
                    border-radius: 10px;
                    background: var(--card-elevated);
                    margin-bottom: 8px;
                    border-left: 4px solid var(--primary-color);
                }

                .event-category-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    color: white;
                    margin-top: 5px;
                }

                .event-delete-btn {
                    background: rgba(255, 77, 77, 0.1);
                    border: none;
                    color: #ff4d4d;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .event-delete-btn:hover {
                    background: #ff4d4d;
                    color: white;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-template-rows: auto 1fr 1fr 1fr 1fr 1fr; /* Header + 5/6 weeks */
                    gap: 8px;
                    flex: 1;
                    min-height: 0; /* Important for grid overflow */
                }

                .weekday-header {
                    text-align: center;
                    font-weight: 700;
                    color: var(--text-color);
                    opacity: 0.7;
                    padding-bottom: 10px;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 1px;
                }

                .calendar-cell {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--border-color);
                    min-height: 0; /* Allow shrinking */
                    overflow: hidden;
                }

                .calendar-cell:hover {
                    background: var(--nav-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    z-index: 1;
                }

                .calendar-cell.disabled {
                    opacity: 0.4;
                    background: transparent;
                }

                .calendar-cell.selected {
                    border-color: var(--primary-color);
                    background: var(--card-elevated);
                    box-shadow: 0 0 0 2px var(--primary-color) inset;
                }

                .calendar-cell.today {
                    background: var(--card-elevated);
                    border: 1px solid var(--primary-color);
                }
                
                .calendar-cell.today .day-number {
                    background: var(--primary-color);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cell-header {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 4px;
                }

                .day-number {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-color);
                }

                .cell-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    overflow-y: auto;
                }

                .cell-content::-webkit-scrollbar {
                    width: 0px; /* Hide scrollbar for cleaner look */
                }

                .mini-task-pill {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--primary-color);
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .mini-task-pill.completed {
                    background: var(--secondary-color);
                    text-decoration: line-through;
                    opacity: 0.8;
                }

                .more-tasks {
                    font-size: 0.65rem;
                    color: var(--text-color);
                    text-align: center;
                    opacity: 0.7;
                }

                /* Popup Styles */
                .event-list {
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                }

                .event-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: var(--card-bg);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    border-left: 4px solid var(--primary-color);
                    border: 1px solid var(--border-color);
                }

                .event-item.completed {
                    border-left-color: var(--secondary-color);
                    opacity: 0.7;
                }

                .event-time {
                    font-size: 0.8rem;
                    color: #666;
                    width: 60px;
                    flex-shrink: 0;
                }

                .event-details {
                    flex: 1;
                }

                .event-title {
                    font-weight: 600;
                    color: var(--text-color);
                }

                .event-category {
                    font-size: 0.75rem;
                    color: #888;
                }

                .no-events {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                    font-style: italic;
                }

                .new-event-form {
                    border-top: 1px solid var(--border-color);
                    padding-top: 15px;
                }

                @media (max-width: 768px) {
                    .anime-calendar-container {
                        padding: 12px;
                        border-radius: 16px;
                    }

                    .calendar-header {
                        flex-direction: column;
                        gap: 12px;
                        align-items: flex-start;
                    }

                    .month-title {
                        font-size: 1.5rem;
                    }

                    .header-actions {
                        width: 100%;
                        justify-content: space-between;
                        flex-wrap: wrap;
                    }

                    .view-toggle {
                        margin-right: 0;
                        width: 100%;
                        justify-content: center;
                        margin-bottom: 8px;
                    }

                    .calendar-grid {
                        gap: 4px;
                    }

                    .calendar-cell {
                        padding: 4px;
                        min-height: 60px;
                    }

                    .calendar-cell.week-cell {
                        min-height: 120px;
                    }

                    .day-number {
                        font-size: 0.8rem;
                    }

                    .weekday-header {
                        font-size: 0.7rem;
                        padding-bottom: 4px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .mini-task-pill {
                        font-size: 0.6rem;
                        padding: 2px 4px;
                        border-left-width: 2px !important;
                    }
                    
                    .more-tasks {
                        font-size: 0.6rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Calendar;
