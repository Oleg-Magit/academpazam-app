import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number; // 0 to 100
    label?: string;
    showValue?: boolean;
    labelInside?: boolean;
    height?: number;
    isMini?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, showValue = true, labelInside = false, height, isMini = false }) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    return (
        <div className={styles.container}>
            {(label || (showValue && !labelInside)) && (
                <div className={styles.header}>
                    {label && <span className={styles.label}>{label}</span>}
                    {showValue && !labelInside && <span className={styles.value}>{percentage.toFixed(1)}%</span>}
                </div>
            )}
            <div className={styles.track} style={height ? { height: `${height}px` } : {}}>
                <div
                    className={styles.fill}
                    style={{ width: `${percentage}%` }}
                >
                    {labelInside && percentage > 15 && (
                        <span className={isMini ? styles.miniLabel : styles.internalLabel}>
                            {percentage.toFixed(0)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
