import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { habitService } from '../services/habitService';

const HabitsContext = createContext();

export const useHabits = () => useContext(HabitsContext);

export const HabitsProvider = ({ children }) => {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshHabits = useCallback(async () => {
        try {
            setLoading(true);
            const data = await habitService.getAll();
            setHabits(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load habits:', err);
            setError('Failed to load habits');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshHabits();
    }, [refreshHabits]);

    const createHabit = async (habitData) => {
        try {
            await habitService.create(habitData);
            await refreshHabits();
        } catch (err) {
            console.error('Failed to create habit', err);
            throw err;
        }
    };

    const deleteHabit = async (id) => {
        try {
            await habitService.delete(id);
            await refreshHabits();
        } catch (err) {
            console.error('Failed to delete habit', err);
            throw err;
        }
    };

    const toggleHabitLog = async (id, date = new Date()) => {
        try {
            await habitService.toggleLog(id, date);
            await refreshHabits();
        } catch (err) {
            console.error('Failed to toggle habit', err);
            throw err;
        }
    };

    return (
        <HabitsContext.Provider value={{ habits, loading, error, refreshHabits, createHabit, deleteHabit, toggleHabitLog }}>
            {children}
        </HabitsContext.Provider>
    );
};
