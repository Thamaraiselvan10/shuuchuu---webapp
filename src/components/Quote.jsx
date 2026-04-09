import React, { useState, useEffect } from 'react';

const QUOTES = {
    goals: [
        "The only way to do great work is to love what you do.",
        "Believe you can and you're halfway there.",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you."
    ],
    tasks: [
        "Action is the foundational key to all success.",
        "Don't watch the clock; do what it does. Keep going.",
        "The secret of getting ahead is getting started.",
        "Small steps in the right direction can turn out to be the biggest step of your life."
    ],
    focus: [
        "Focus on being productive instead of busy.",
        "Starve your distractions, feed your focus.",
        "Concentrate all your thoughts upon the work at hand.",
        "The successful warrior is the average man, with laser-like focus."
    ],
    diary: [
        "Write it on your heart that every day is the best day in the year.",
        "Keep your face always toward the sunshine—and shadows will fall behind you.",
        "Happiness depends upon ourselves.",
        "Every day may not be good... but there's something good in every day."
    ]
};

const Quote = ({ category = 'goals' }) => {
    const [quote, setQuote] = useState('');
    const [displayedQuote, setDisplayedQuote] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const list = QUOTES[category] || QUOTES.goals;
        const random = list[Math.floor(Math.random() * list.length)];
        setQuote(random);
        setDisplayedQuote('');
        setIsTyping(true);
    }, [category]);

    useEffect(() => {
        if (isTyping && quote) {
            if (displayedQuote.length < quote.length) {
                const timeout = setTimeout(() => {
                    setDisplayedQuote(quote.slice(0, displayedQuote.length + 1));
                }, 50); // Typing speed
                return () => clearTimeout(timeout);
            } else {
                setIsTyping(false);
            }
        }
    }, [quote, displayedQuote, isTyping]);

    return (
        <div className="quote-container">
            <p className="quote-text">
                "{displayedQuote}"

            </p>
            <style>{`
                .quote-container {
                    padding: 0;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                    min-height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .quote-text {
                    margin: 0;
                    font-style: italic;
                    color: var(--text-color);
                    font-weight: 300;
                    font-size: 1.1rem;
                    letter-spacing: 0.5px;
                    opacity: 0.9;
                    line-height: 1.6;
                }

                /* Removed conflicting media query */
            `}</style>
        </div>
    );
};

export default Quote;
