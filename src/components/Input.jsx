import React from 'react';
import './Input.css';

const Input = ({ label, error, className = '', style, ...props }) => {
    return (
        <div className={`input-wrapper ${className}`} style={style}>
            {label && <label className="input-label">{label}</label>}
            <input
                className={`input-field ${error ? 'input-error' : ''}`}
                {...props}
            />
            {error && <span className="input-error-text">{error}</span>}
            <style>{`
                .input-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                }
                .input-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin-left: 4px;
                }
                .input-field {
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 2px solid transparent;
                    background: rgba(255, 255, 255, 0.5);
                    font-family: inherit;
                    font-size: 1rem;
                    color: var(--text-color);
                    transition: all 0.3s ease;
                    outline: none;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
                }
                .input-field:focus {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 4px rgba(255, 183, 178, 0.2);
                }
                .input-field::placeholder {
                    color: rgba(0,0,0,0.3);
                }
                [data-theme='dark'] .input-field {
                    background: rgba(0, 0, 0, 0.2);
                    color: var(--text-color);
                }
                [data-theme='dark'] .input-field:focus {
                    background: rgba(0, 0, 0, 0.4);
                }
                [data-theme='dark'] .input-field::placeholder {
                    color: rgba(255,255,255,0.3);
                }
            `}</style>
        </div>
    );
};

export default Input;
