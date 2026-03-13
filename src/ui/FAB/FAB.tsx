import React, { useState, useRef, useEffect } from 'react';
import { Plus, GraduationCap, CalendarPlus, X } from 'lucide-react';
import { useTranslation } from '@/app/i18n/useTranslation';
import styles from './FAB.module.css';

interface FABProps {
  onAddCourse: () => void;
  onAddSemester: () => void;
}

export const FAB: React.FC<FABProps> = ({ onAddCourse, onAddSemester }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className={styles.fabContainer} ref={fabRef}>
      <div className={`${styles.actions} ${isOpen ? styles.open : ''}`}>
        <div className={styles.actionItem}>
          <span className={styles.actionLabel}>{t('dashboard.add_course')}</span>
          <button 
            className={styles.actionButton} 
            onClick={() => handleAction(onAddCourse)}
            aria-label={t('dashboard.add_course')}
          >
            <GraduationCap size={20} />
          </button>
        </div>
        <div className={styles.actionItem}>
          <span className={styles.actionLabel}>{t('action.add_semester')}</span>
          <button 
            className={styles.actionButton} 
            onClick={() => handleAction(onAddSemester)}
            aria-label={t('action.add_semester')}
          >
            <CalendarPlus size={20} />
          </button>
        </div>
      </div>

      <button 
        className={`${styles.mainButton} ${isOpen ? styles.active : ''}`}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-label={isOpen ? t('label.close') : t('label.more_options')}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
};
