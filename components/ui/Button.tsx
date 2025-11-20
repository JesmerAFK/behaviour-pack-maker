
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({ className, ...props }) => {
  return (
    <button
      className={`bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center ${className}`}
      {...props}
    />
  );
};
