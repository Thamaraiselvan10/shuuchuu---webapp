import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // We maintain a "local user" object to avoid breaking existing components
    const [currentUser, setCurrentUser] = useState({ 
        email: 'local-user@shuuchuu.app', 
        name: 'Local Hero',
        minutes_used: 0 
    });
    const [loading, setLoading] = useState(false);
    
    // Load local data on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('shuuchuu_user');
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                // Keep default
            }
        }
    }, []);

    // Cleanup: Remove server-related refs
    const timerRef = useRef(null);

    // Track time as a simple local increment
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentUser(prev => {
                const updated = { 
                    ...prev, 
                    minutes_used: (prev.minutes_used || 0) + 1 
                };
                localStorage.setItem('shuuchuu_user', JSON.stringify(updated));
                return updated;
            });
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, []);

    // Stubs for compatibility with login/profile pages if any remain
    const signup = async () => ({ email: 'local-user@shuuchuu.app' });
    const login = async () => ({ email: 'local-user@shuuchuu.app' });
    const logout = () => {
        // Just reset minutes to 0 if they want to 'reset' local account
        const resetUser = { email: 'local-user@shuuchuu.app', minutes_used: 0 };
        setCurrentUser(resetUser);
        localStorage.setItem('shuuchuu_user', JSON.stringify(resetUser));
    };

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
