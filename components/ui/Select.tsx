
import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select: React.FC<SelectProps> = ({ className, ...props }) => {
  return (
    <select
      className={`w-full p-2 bg-subtle border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-200 ${className}`}
      {...props}
    />
  );
};
