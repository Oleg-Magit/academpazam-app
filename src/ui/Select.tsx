import React from 'react';
import styles from './Input.module.css'; // Recycle Input styles

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => {
    return (
        <div className={styles.container}>
            {label && <label className={styles.label} htmlFor={props.id}>{label}</label>}
            <select
                className={`${styles.input} ${error ? styles.errorInput : ''} ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
};
