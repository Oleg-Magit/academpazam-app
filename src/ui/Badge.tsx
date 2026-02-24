import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'neutral' | 'info' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral' }) => {
    return (
        <span className={`${styles.badge} ${styles[variant]} `}>
            {children}
        </span>
    );
};
