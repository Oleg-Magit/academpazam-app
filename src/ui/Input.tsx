import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', required, ...props }) => {
    return (
        <div className={styles.container}>
            {label && (
                <label className={styles.label} htmlFor={props.id}>
                    {label}
                    {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
                </label>
            )}
            <input
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${props.id}-error` : undefined}
                {...props}
            />
            {error && <span id={`${props.id}-error`} className={styles.errorText} role="alert">{error}</span>}
        </div>
    );
};
