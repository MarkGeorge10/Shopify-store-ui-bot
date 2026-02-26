import React from 'react';

/**
 * Parses Markdown links `[label](url)` in chat message text
 * and renders them as clickable <a> elements.
 */
export function renderMessageText(text: string, role: 'user' | 'model') {
    const parts = text.split(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g);
    return parts.map((part, i) => {
        if (i % 3 === 1) return null; // label — consumed with URL slice below
        if (i % 3 === 2) {
            const label = parts[i - 1];
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline font-semibold break-all ${role === 'user'
                            ? 'text-indigo-200 hover:text-white'
                            : 'text-indigo-600 hover:text-indigo-800'
                        }`}
                >
                    {label}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}
