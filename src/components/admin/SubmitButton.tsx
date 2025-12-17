import React from 'react';

interface SubmitButtonProps {
    loading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    loadingText?: string;
    className?: string;
    type?: 'submit' | 'button';
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    loading = false,
    disabled = false,
    children,
    loadingText = 'Kaydediliyor...',
    className = '',
    type = 'submit',
    onClick,
    variant = 'primary',
}) => {
    const isDisabled = loading || disabled;

    const buttonClassName = `
        px-6 py-3 rounded-lg font-semibold transition-all
        flex items-center justify-center gap-2
        shadow-lg hover:shadow-xl
        ${variantStyles[variant]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
    `.trim();

    return (
        <button
            type={type}
            disabled={isDisabled}
            onClick={onClick}
            className={buttonClassName}
        >
            {loading && (
                <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {loading ? loadingText : children}
        </button>
    );
};
