import React, { useEffect, useState } from 'react';

const ViewCounter: React.FC = () => {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Increment count on first load
                const hasVisited = sessionStorage.getItem('hasVisited');
                if (!hasVisited) {
                    await fetch('/.netlify/functions/view-count', { method: 'POST' });
                    sessionStorage.setItem('hasVisited', 'true');
                }

                // Fetch current count
                const response = await fetch('/.netlify/functions/view-count');
                const data = await response.json();
                setCount(data.count);
            } catch (error) {
                console.error('Error fetching view count:', error);
            }
        };

        fetchCount();
    }, []);

    if (count === null) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50 backdrop-blur-sm">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{count.toLocaleString()} Views</span>
        </div>
    );
};

export default ViewCounter;
