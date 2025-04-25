import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    helperText, 
    error, 
    leftIcon, 
    rightIcon, 
    fullWidth = false,
    as = 'input',
    rows = 3,
    id,
    ...props 
  }, ref) => {
    // Generate a unique ID if one is not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    const inputClasses = cn(
      'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-error-500 focus:ring-error-500',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      className
    );
    
    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId} 
            className="mb-1.5 text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          
          {as === 'textarea' ? (
            <textarea
              id={inputId}
              className={inputClasses}
              rows={rows}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              id={inputId}
              className={cn(inputClasses, 'h-10')}
              ref={ref}
              {...props}
            />
          )}
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(helperText || error) && (
          <p className={cn(
            'mt-1.5 text-xs',
            error ? 'text-error-500' : 'text-gray-500'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;