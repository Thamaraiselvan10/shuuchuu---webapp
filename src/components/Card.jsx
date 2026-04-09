import React from 'react';
import './Card.css';

const Card = ({ children, title, className = '', ...props }) => {
    return (
        <div className={`card ${className}`} {...props}>
            {title && <div className="card-header"><h3>{title}</h3></div>}
            <div className="card-body">{children}</div>
        </div>
    );
};

export default Card;
