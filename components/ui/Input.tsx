
import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`w-full p-2 bg-subtle border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-200 ${className}`}
      {...props}
    />
  );
};
