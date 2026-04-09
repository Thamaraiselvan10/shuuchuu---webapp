import React, { createContext, useContext, useState, useEffect } from 'react';
import { goalService } from '../services/goalService';

const GoalsContext = createContext();

export const useGoals = () => useContext(GoalsContext);

export const GoalsProvider = ({ children }) => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const data = await goalService.getAllGoals();
            setGoals(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to load goals:', error);
            setLoading(false);
        }
    };

    const addGoal = async (goalData) => {
        try {
            const newGoal = await goalService.createGoal(goalData);
            setGoals([newGoal, ...goals]);
            return newGoal;
        } catch (error) {
            console.error('Failed to create goal:', error);
            throw error;
        }
    };

    const updateGoal = async (id, updates) => {
        try {
            await goalService.updateGoal(id, updates);
            setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (error) {
            console.error('Failed to update goal:', error);
            throw error;
        }
    };

    const deleteGoal = async (id) => {
        try {
            await goalService.deleteGoal(id);
            setGoals(goals.filter(g => g.id !== id));
        } catch (error) {
            console.error('Failed to delete goal:', error);
            throw error;
        }
    };

    const getGoalPhases = async (goalId) => {
        try {
            return await goalService.getPhasesByGoalId(goalId);
        } catch (error) {
            console.error('Failed to load phases:', error);
            return [];
        }
    };

    const addPhase = async (phaseData) => {
        try {
            return await goalService.createPhase(phaseData);
        } catch (error) {
            console.error('Failed to create phase:', error);
            throw error;
        }
    };

    const updatePhase = async (id, updates) => {
        try {
            return await goalService.updatePhase(id, updates);
        } catch (error) {
            console.error('Failed to update phase:', error);
            throw error;
        }
    };

    const deletePhase = async (id) => {
        try {
            await goalService.deletePhase(id);
        } catch (error) {
            console.error('Failed to delete phase:', error);
            throw error;
        }
    };

    const reorderPhases = async (phasesWithNewOrder) => {
        try {
            // Update each phase with new order_index
            await Promise.all(
                phasesWithNewOrder.map((phase, index) =>
                    goalService.updatePhase(phase.id, { order_index: index })
                )
            );
        } catch (error) {
            console.error('Failed to reorder phases:', error);
            throw error;
        }
    };

    return (
        <GoalsContext.Provider value={{
            goals,
            loading,
            addGoal,
            updateGoal,
            deleteGoal,
            getGoalPhases,
            addPhase,
            updatePhase,
            deletePhase,
            reorderPhases,
            refreshGoals: loadGoals
        }}>
            {children}
        </GoalsContext.Provider>
    );
};
