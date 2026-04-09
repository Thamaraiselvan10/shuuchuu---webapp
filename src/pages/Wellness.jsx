import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { articles } from '../data/articles';


const Wellness = () => {
    const [selectedArticle, setSelectedArticle] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const articleId = searchParams.get('articleId');
        if (articleId) {
            const article = articles.find(a => a.id === parseInt(articleId));
            if (article) {
                setSelectedArticle(article);
            }
        }
    }, [location]);

    // Articles imported from ../data/articles

    return (
        <div className="wellness-container">
            <div className="wellness-hero">
                <div className="hero-content">
                    <h1>Wellness & Productivity</h1>
                    <p>Curated insights to help you stay balanced, focused, and healthy.</p>
                </div>
            </div>

            <div className="wellness-grid">
                {articles.map((article, index) => (
                    <div
                        key={article.id}
                        className="anime-article-card"
                        onClick={() => setSelectedArticle(article)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="card-image-wrapper">
                            <div className="card-image" style={{ backgroundImage: `url(${article.image})` }}></div>
                            <div className="card-category">{article.category}</div>
                        </div>
                        <div className="card-content">
                            <h3>{article.title}</h3>
                            <p>{article.summary}</p>
                            <div className="card-footer">
                                <span className="read-time">⏱ {article.readTime}</span>
                                <span className="read-more">Read Article →</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full Screen Reader Overlay */}
            {selectedArticle && (
                <div className="reader-overlay">
                    <div className="reader-backdrop" onClick={() => setSelectedArticle(null)}></div>
                    <div className="reader-modal glass-panel">
                        <button className="close-reader-btn" onClick={() => setSelectedArticle(null)}>×</button>

                        <div className="reader-header" style={{ backgroundImage: `url(${selectedArticle.image})` }}>
                            <div className="reader-header-content">
                                <div>
                                    <span className="reader-category">{selectedArticle.category}</span>
                                    <h1>{selectedArticle.title}</h1>
                                </div>
                                <div className="reader-meta">
                                    <span>⏱ {selectedArticle.readTime}</span>
                                </div>
                            </div>
                        </div>

                        <div className="reader-body">
                            <div
                                className="reader-text"
                                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .wellness-container {
                    padding: 30px;
                    height: calc(100vh - 40px); /* Adjust for main layout padding */
                    overflow-y: auto;
                    padding-bottom: 100px;
                }

                .wellness-hero {
                    margin-bottom: 20px;
                    text-align: center;
                    padding: 20px 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
                    border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .wellness-hero h1 {
                    font-size: 1.5rem;
                    margin: 0 0 5px 0;
                    color: white;
                }

                .wellness-hero p {
                    font-size: 0.9rem;
                    color: rgba(255,255,255,0.6);
                    margin: 0;
                }

                .wellness-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                    padding-bottom: 40px;
                }

                @media (max-width: 1024px) {
                    .wellness-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 600px) {
                    .wellness-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .anime-article-card {
                    background: var(--card-bg);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.05);
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 350px;
                }

                .anime-article-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    border-color: rgba(255,255,255,0.2);
                }

                .card-image-wrapper {
                    height: 160px;
                    overflow: hidden;
                    position: relative;
                }

                .card-image {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    transition: transform 0.5s ease;
                }

                .anime-article-card:hover .card-image {
                    transform: scale(1.1);
                }

                .card-category {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(5px);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .card-content {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .card-content h3 {
                    font-size: 1.2rem;
                    margin: 0 0 8px 0;
                    color: var(--text-color);
                    line-height: 1.3;
                }

                .card-content p {
                    font-size: 0.9rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    margin-bottom: 15px;
                    line-height: 1.5;
                    flex: 1;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .read-time {
                    font-size: 0.8rem;
                    color: var(--text-color);
                    opacity: 0.5;
                }

                .read-more {
                    font-size: 0.9rem;
                    color: var(--primary-color);
                    font-weight: bold;
                    transition: transform 0.2s;
                }

                .anime-article-card:hover .read-more {
                    transform: translateX(5px);
                }

                /* Reader Overlay */
                .reader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 2000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                }

                .reader-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                    animation: fadeIn 0.3s ease;
                }

                .reader-modal {
                    width: 100%;
                    max-width: 900px;
                    height: 90vh;
                    background: var(--card-bg);
                    border-radius: 24px;
                    position: relative;
                    z-index: 2001;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .close-reader-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.5);
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    z-index: 10;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    backdrop-filter: blur(5px);
                }

                .close-reader-btn:hover {
                    background: var(--primary-color);
                    transform: rotate(90deg);
                }

                .reader-header {
                    height: 180px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                    flex-shrink: 0;
                }

                .reader-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8));
                }

                .reader-header-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 25px 30px;
                    color: white;
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                }

                .reader-category {
                    display: inline-block;
                    background: var(--primary-color);
                    padding: 4px 10px;
                    border-radius: 15px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }

                .reader-header h1 {
                    font-size: 2rem;
                    margin: 0;
                    line-height: 1.2;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }

                .reader-meta {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    margin-left: 20px;
                    white-space: nowrap;
                }

                .reader-body {
                    padding: 30px;
                    overflow-y: auto;
                    flex: 1;
                }

                .reader-text {
                    max-width: 700px;
                    margin: 0 auto;
                    font-size: 1.15rem;
                    line-height: 1.8;
                    color: var(--text-color);
                }

                .reader-text h3 {
                    font-size: 1.8rem;
                    color: var(--primary-color);
                    margin: 40px 0 20px 0;
                }

                .reader-text p {
                    margin-bottom: 25px;
                }

                .reader-text ul, .reader-text ol {
                    background: rgba(255,255,255,0.03);
                    padding: 30px 50px;
                    border-radius: 16px;
                    margin-bottom: 30px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .reader-text li {
                    margin-bottom: 15px;
                }

                .reader-text strong {
                    color: var(--primary-color);
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @media (max-width: 768px) {
                    .reader-modal {
                        height: 100%;
                        border-radius: 0;
                    }
                    .reader-header h1 {
                        font-size: 1.8rem;
                    }
                    .hero-content h1 {
                        font-size: 2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default Wellness;
