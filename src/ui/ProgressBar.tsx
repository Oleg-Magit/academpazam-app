import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number; // 0 to 100
    label?: string;
    showValue?: boolean;
    height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, showValue = true, height }) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    return (
        <div className={styles.container}>
            {(label || showValue) && (
                <div className={styles.header}>
                    {label && <span className={styles.label}>{label}</span>}
                    {showValue && <span className={styles.value}>{percentage.toFixed(1)}%</span>}
                </div>
            )}
            <div className={styles.track} style={height ? { height: `${height}px` } : {}}>
                <div
                    className={styles.fill}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
