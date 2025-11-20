
import React from 'react';

type CardProps = {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-surface border border-subtle rounded-lg shadow-md ${className}`}>
            {children}
        </div>
    );
};
