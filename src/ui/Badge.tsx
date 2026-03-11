import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'neutral' | 'info' | 'error';
    className?: string;
    style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', style }) => {
    return (
        <span 
            className={`${styles.badge} ${styles[variant]} ${className}`.trim()}
            style={style}
        >
            {children}
        </span>
    );
};
