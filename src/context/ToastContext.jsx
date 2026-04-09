import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = uuidv4();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`} onClick={() => removeToast(toast.id)}>
                        {toast.message}
                    </div>
                ))}
            </div>
            <style>{`
                .toast-container {
                    position: fixed;
                    top: 90px;
                    right: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 100000;
                }
                .toast {
                    padding: 12px 20px;
                    border-radius: 8px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    color: #333;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid #333;
                    min-width: 250px;
                }
                .toast-success { border-left-color: #10B981; }
                .toast-error { border-left-color: #EF4444; }
                .toast-info { border-left-color: var(--primary-color); }
                .toast-warning { border-left-color: #F59E0B; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)); }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                @media (prefers-color-scheme: dark) {
                    .toast {
                        background: #333;
                        color: white;
                        border-left-color: #fff;
                    }
                    .toast-success { border-left-color: #10B981; }
                    .toast-error { border-left-color: #EF4444; }
                    .toast-info { border-left-color: var(--primary-color); }
                    .toast-warning { border-left-color: #F59E0B; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(24, 24, 27, 0.95)); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
