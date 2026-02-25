import React from 'react';
import styles from './Input.module.css'; // Recycle Input styles

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', required, ...props }) => {
    return (
        <div className={styles.container}>
            {label && (
                <label className={styles.label} htmlFor={props.id}>
                    {label}
                    {required && <span style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>*</span>}
                </label>
            )}
            <select
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${props.id}-error` : undefined}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span id={`${props.id}-error`} className={styles.errorText} role="alert">{error}</span>}
        </div>
    );
};
