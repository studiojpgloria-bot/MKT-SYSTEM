
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    icon,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    return (
        <div className={`space-y-1.5 ${containerClassName}`}>
            {label && (
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
            w-full bg-slate-50 dark:bg-[#0b0e11] border rounded-xl text-slate-900 dark:text-white 
            outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600
            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            disabled:opacity-60 disabled:cursor-not-allowed
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-[#2a303c]'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
