import { useState, useCallback, useRef } from 'react';

export type ValidationRules<T> = {
    [K in keyof T]?: {
        required?: boolean | string;
        minLength?: { value: number; message: string };
        maxLength?: { value: number; message: string };
        pattern?: { value: RegExp; message: string };
        custom?: (value: T[K], allValues: T) => string | undefined;
    };
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export interface UseFormValidationReturn<T> {
    errors: FieldErrors<T>;
    setFieldError: (field: keyof T, message: string) => void;
    clearFieldError: (field: keyof T) => void;
    clearErrors: () => void;
    validate: (data: T, rules: ValidationRules<T>) => boolean;
    validateField: (field: keyof T, value: unknown, rules: ValidationRules<T>, allValues: T) => boolean;
    hasErrors: boolean;
    getInputClassName: (field: keyof T, baseClass?: string) => string;
    focusFirstError: () => void;
    registerRef: (field: keyof T) => (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
}

export const useFormValidation = <T extends object>(): UseFormValidationReturn<T> => {
    const [errors, setErrors] = useState<FieldErrors<T>>({});
    const fieldRefs = useRef<Partial<Record<keyof T, HTMLInputElement | HTMLTextAreaElement | null>>>({});

    const setFieldError = useCallback((field: keyof T, message: string) => {
        setErrors(prev => ({ ...prev, [field]: message }));
    }, []);

    const clearFieldError = useCallback((field: keyof T) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    const clearErrors = useCallback(() => {
        setErrors({});
    }, []);

    const validateField = useCallback((
        field: keyof T,
        value: unknown,
        rules: ValidationRules<T>,
        allValues: T
    ): boolean => {
        const fieldRules = rules[field];
        if (!fieldRules) return true;

        // Required check
        if (fieldRules.required) {
            const isEmpty = value === undefined || value === null || value === '' ||
                (typeof value === 'string' && value.trim() === '');
            if (isEmpty) {
                const message = typeof fieldRules.required === 'string'
                    ? fieldRules.required
                    : 'Bu alan zorunludur';
                setFieldError(field, message);
                return false;
            }
        }

        // String validations
        if (typeof value === 'string') {
            if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
                setFieldError(field, fieldRules.minLength.message);
                return false;
            }
            if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
                setFieldError(field, fieldRules.maxLength.message);
                return false;
            }
            if (fieldRules.pattern && !fieldRules.pattern.value.test(value)) {
                setFieldError(field, fieldRules.pattern.message);
                return false;
            }
        }

        // Custom validation
        if (fieldRules.custom) {
            const customError = fieldRules.custom(value as T[keyof T], allValues);
            if (customError) {
                setFieldError(field, customError);
                return false;
            }
        }

        clearFieldError(field);
        return true;
    }, [setFieldError, clearFieldError]);

    const validate = useCallback((data: T, rules: ValidationRules<T>): boolean => {
        clearErrors();
        let isValid = true;
        const newErrors: FieldErrors<T> = {};

        for (const field of Object.keys(rules) as Array<keyof T>) {
            const fieldRules = rules[field];
            if (!fieldRules) continue;

            const value = data[field];

            // Required check
            if (fieldRules.required) {
                const isEmpty = value === undefined || value === null || value === '' ||
                    (typeof value === 'string' && value.trim() === '');
                if (isEmpty) {
                    const message = typeof fieldRules.required === 'string'
                        ? fieldRules.required
                        : 'Bu alan zorunludur';
                    newErrors[field] = message;
                    isValid = false;
                    continue;
                }
            }

            // String validations
            if (typeof value === 'string') {
                if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
                    newErrors[field] = fieldRules.minLength.message;
                    isValid = false;
                    continue;
                }
                if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
                    newErrors[field] = fieldRules.maxLength.message;
                    isValid = false;
                    continue;
                }
                if (fieldRules.pattern && !fieldRules.pattern.value.test(value)) {
                    newErrors[field] = fieldRules.pattern.message;
                    isValid = false;
                    continue;
                }
            }

            // Custom validation
            if (fieldRules.custom) {
                const customError = fieldRules.custom(value as T[keyof T], data);
                if (customError) {
                    newErrors[field] = customError;
                    isValid = false;
                }
            }
        }

        setErrors(newErrors);
        return isValid;
    }, [clearErrors]);

    const hasErrors = Object.keys(errors).length > 0;

    const getInputClassName = useCallback((field: keyof T, baseClass = ''): string => {
        const errorClass = errors[field]
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
        return `${baseClass} ${errorClass}`.trim();
    }, [errors]);

    const focusFirstError = useCallback(() => {
        const firstErrorField = Object.keys(errors)[0] as keyof T | undefined;
        if (firstErrorField && fieldRefs.current[firstErrorField]) {
            fieldRefs.current[firstErrorField]?.focus();
            fieldRefs.current[firstErrorField]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [errors]);

    const registerRef = useCallback((field: keyof T) => {
        return (el: HTMLInputElement | HTMLTextAreaElement | null) => {
            fieldRefs.current[field] = el;
        };
    }, []);

    return {
        errors,
        setFieldError,
        clearFieldError,
        clearErrors,
        validate,
        validateField,
        hasErrors,
        getInputClassName,
        focusFirstError,
        registerRef,
    };
};
