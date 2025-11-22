import React, { useEffect, useState } from 'react';

interface DownloadCounterProps {
    itemId: string;
    className?: string;
}

const DownloadCounter: React.FC<DownloadCounterProps> = ({ itemId, className = '' }) => {
    const [count, setCount] = useState<number | null>(null);

    const fetchCount = async () => {
        try {
            const response = await fetch(`/.netlify/functions/download-count?itemId=${itemId}`);
            const data = await response.json();
            setCount(data.count);
        } catch (error) {
            console.error('Error fetching download count:', error);
        }
    };

    useEffect(() => {
        fetchCount();
    }, [itemId]);

    return (
        <span className={`text-xs text-gray-500 ${className}`}>
            {count !== null ? `${count.toLocaleString()} Downloads` : '...'}
        </span>
    );
};

export const incrementDownload = async (itemId: string) => {
    try {
        await fetch(`/.netlify/functions/download-count?itemId=${itemId}`, { method: 'POST' });
    } catch (error) {
        console.error('Error incrementing download count:', error);
    }
};

export default DownloadCounter;
