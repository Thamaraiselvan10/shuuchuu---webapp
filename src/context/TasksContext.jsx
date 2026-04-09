import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';
import { useCelebration } from './CelebrationContext';
import { useSettings } from './SettingsContext';

const TasksContext = createContext();

export const useTasks = () => {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};

export const TasksProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { triggerCelebration } = useCelebration();
    const { settings } = useSettings();

    const refreshTasks = useCallback(async () => {
        try {
            // Don't set loading to true for background refreshes
            const data = await taskService.getAll();
            
            // Auto delete done tasks
            const autoDeleteEnabled = settings?.autoDeleteDoneTasks ?? true;
            if (autoDeleteEnabled) {
                const hoursLimit = settings?.autoDeleteDoneTasksHours || 1;
                const now = new Date();
                
                const tasksToKeep = [];
                for (const task of data) {
                    if (task.status === 'completed' && task.updated_at) {
                        const updatedTime = new Date(task.updated_at);
                        const diffHours = (now - updatedTime) / (1000 * 60 * 60);
                        if (diffHours >= hoursLimit) {
                            try {
                                await taskService.delete(task.id);
                                continue; // Skip keeping this task
                            } catch (e) {
                                console.error('Failed to auto-delete task:', e);
                            }
                        }
                    }
                    tasksToKeep.push(task);
                }
                setTasks(tasksToKeep);
            } else {
                setTasks(data);
            }
            
            setError(null);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [settings?.autoDeleteDoneTasks, settings?.autoDeleteDoneTasksHours]);

    // Initial load
    useEffect(() => {
        refreshTasks();
    }, [refreshTasks]);

    // Poll for updates (every minute)
    useEffect(() => {
        const interval = setInterval(refreshTasks, 60000);
        return () => clearInterval(interval);
    }, [refreshTasks]);

    // CRUD Wrappers that automatically update state
    const addTask = async (taskData) => {
        try {
            await taskService.create(taskData);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to add task:', err);
            throw err;
        }
    };

    const updateTask = async (id, updates) => {
        try {
            await taskService.update(id, updates);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task:', err);
            throw err;
        }
    };

    const deleteTask = async (id) => {
        try {
            await taskService.delete(id);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to delete task:', err);
            throw err;
        }
    };

    const checkCategoryCompletion = (taskId, upcomingStatus) => {
        if (upcomingStatus !== 'completed') return;
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.category || task.category === 'General') return;

        // Find uncompleted tasks in this category
        const uncompletedInCategory = tasks.filter(t => t.category === task.category && t.status !== 'completed');
        
        // If the only uncompleted task corresponds to this taskId, then completing it finishes the category.
        if (uncompletedInCategory.length === 1 && uncompletedInCategory[0].id === taskId) {
            triggerCelebration('tasks_category', task.category);
        }
    };

    const toggleTaskStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            checkCategoryCompletion(id, newStatus);
            await taskService.toggleStatus(id, currentStatus);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to toggle task status:', err);
            throw err;
        }
    };

    // Direct status update for Kanban moves
    const updateTaskStatus = async (id, newStatus) => {
        try {
            checkCategoryCompletion(id, newStatus);
            await taskService.updateStatus(id, newStatus);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task status:', err);
            throw err;
        }
    };

    // Direct priority update for Priority column moves
    const updateTaskPriority = async (id, newPriority) => {
        try {
            await taskService.updatePriority(id, newPriority);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task priority:', err);
            throw err;
        }
    };

    const value = {
        tasks,
        loading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        updateTaskStatus,
        updateTaskPriority
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
};
