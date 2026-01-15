
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
    className?: string;
    contentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    title,
    size = 'md',
    className = '',
    contentClassName = ''
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidths = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-2xl', // Fallback or duplicated
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        full: 'max-w-[95vw] h-[95vh]',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`
          relative bg-white dark:bg-[#151a21] w-full ${maxWidths[size] || maxWidths.md}
          rounded-[32px] shadow-2xl border border-slate-200 dark:border-[#2a303c]
          flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200
          ${className}
        `}
            >
                {/* Header (Optional) */}
                {(title) && (
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-[#2d3340] flex items-center justify-between shrink-0 bg-white dark:bg-[#151a21]">
                        <div className="text-xl font-bold text-slate-900 dark:text-white w-full">
                            {title}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all ml-4"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}

                {/* Close button if no header but still need to close? Usually header handles it, or click outside.
            Let's add a absolute close button if no title is provided but it might overlay content.
            For now, assume title is passed or close via background/custom UI inside children if title is null.
        */}

                <div className={`flex-1 ${contentClassName || 'overflow-auto custom-scrollbar'}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};
