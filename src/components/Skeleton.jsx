import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', variant = 'rect', className = '' }) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'circle':
                return {
                    borderRadius: '50%',
                    width: width,
                    height: height
                };
            case 'text':
                return {
                    borderRadius: '4px',
                    width: width,
                    height: height
                };
            case 'card':
                return {
                    borderRadius: '16px',
                    width: width,
                    height: height
                };
            default: // rect
                return {
                    borderRadius: '8px',
                    width: width,
                    height: height
                };
        }
    };

    return (
        <>
            <div
                className={`skeleton ${className}`}
                style={getVariantStyles()}
            />
            <style>{`
                .skeleton {
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.05) 25%,
                        rgba(255, 255, 255, 0.1) 50%,
                        rgba(255, 255, 255, 0.05) 75%
                    );
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                /* Light theme support */
                [data-theme='light'] .skeleton {
                    background: linear-gradient(
                        90deg,
                        rgba(0, 0, 0, 0.06) 25%,
                        rgba(0, 0, 0, 0.1) 50%,
                        rgba(0, 0, 0, 0.06) 75%
                    );
                    background-size: 200% 100%;
                }
            `}</style>
        </>
    );
};

// Pre-configured skeleton variants for common use cases
export const SkeletonCard = ({ className = '' }) => (
    <div className={`skeleton-card ${className}`} style={{ padding: '16px' }}>
        <Skeleton variant="rect" height="120px" style={{ marginBottom: '12px' }} />
        <Skeleton variant="text" width="80%" height="16px" style={{ marginBottom: '8px' }} />
        <Skeleton variant="text" width="60%" height="14px" />
        <style>{`
            .skeleton-card {
                background: var(--card-bg);
                border-radius: 16px;
                border: 1px solid var(--border-color);
            }
        `}</style>
    </div>
);

export const SkeletonList = ({ count = 3, className = '' }) => (
    <div className={`skeleton-list ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="skeleton-list-item" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <Skeleton variant="circle" width="40px" height="40px" />
                <div style={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height="14px" style={{ marginBottom: '6px' }} />
                    <Skeleton variant="text" width="40%" height="12px" />
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
