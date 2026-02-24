import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, onClick }) => {
    return (
        <div
            className={`${styles.card} ${className} ${onClick ? styles.clickable : ''}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
};
