import React from 'react';
import Button from './Button';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <div className="empty-state-container">
            {icon && <div className="empty-state-icon">{icon}</div>}
            <h3 className="empty-state-title">{title}</h3>
            {description && <p className="empty-state-description">{description}</p>}
            {action && (
                <Button onClick={action.onClick} variant="primary">
                    {action.label}
                </Button>
            )}

            <style>{`
                .empty-state-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                    animation: fadeIn 0.3s ease;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .empty-state-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: rgba(var(--primary-rgb, 255, 117, 140), 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 24px;
                    color: var(--primary-color);
                }

                .empty-state-icon svg {
                    width: 40px;
                    height: 40px;
                }

                .empty-state-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin: 0 0 8px 0;
                }

                .empty-state-description {
                    font-size: 0.95rem;
                    color: var(--text-color);
                    opacity: 0.6;
                    margin: 0 0 24px 0;
                    max-width: 300px;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
};

export default EmptyState;
