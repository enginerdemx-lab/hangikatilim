import React from 'react';

interface FormInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    type?: 'text' | 'email' | 'url' | 'number' | 'password' | 'tel';
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    inputRef?: (el: HTMLInputElement | null) => void;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    name,
    value,
    onChange,
    error,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    className = '',
    inputRef,
}) => {
    const inputClassName = `
        w-full px-4 py-2 border rounded-lg transition-colors
        focus:ring-2 focus:outline-none
        ${error
            ? 'border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className}
    `.trim();

    return (
        <div className="space-y-1">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
                ref={inputRef}
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={inputClassName}
            />
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};

interface FormTextareaProps {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    rows?: number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    textareaRef?: (el: HTMLTextAreaElement | null) => void;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    label,
    name,
    value,
    onChange,
    error,
    rows = 3,
    placeholder,
    required = false,
    disabled = false,
    className = '',
    textareaRef,
}) => {
    const textareaClassName = `
        w-full px-4 py-2 border rounded-lg transition-colors
        focus:ring-2 focus:outline-none resize-none
        ${error
            ? 'border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50'
            : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
        ${className}
    `.trim();

    return (
        <div className="space-y-1">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                ref={textareaRef}
                id={name}
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled}
                className={textareaClassName}
            />
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};
