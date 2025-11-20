
import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  return (
    <textarea
      className={`w-full p-2 bg-subtle border border-muted rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-gray-200 resize-y ${className}`}
      {...props}
    ></textarea>
  );
};
