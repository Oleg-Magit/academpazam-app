import React, { useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Button } from '@/ui/Button';
import { saveTopic } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import type { Topic } from '@/core/models/types';
import { useTranslation } from '@/app/i18n/useTranslation';

interface BulkAddTopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    courseId: string;
}

export const BulkAddTopicModal: React.FC<BulkAddTopicModalProps> = ({ isOpen, onClose, onSave, courseId }) => {
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const handleSave = async () => {
        const lines = text.split('\n').filter(l => l.trim());
        for (const line of lines) {
            const topic: Topic = {
                id: uuidv4(),
                courseId,
                title: line.trim(),
                status: 'not_started',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            await saveTopic(topic);
        }
        setText('');
        onSave();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modal.bulk_topic.title')}>
            <div>
                <p style={{ marginBottom: 'var(--space-md)', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {t('modal.bulk_topic.instruction')}
                </p>
                <label htmlFor="bulk-topics-text" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    {t('modal.bulk_topic.title')}
                </label>
                <textarea
                    id="bulk-topics-text"
                    name="bulkTopicsText"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    style={{ width: '100%', height: '300px', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                    placeholder={t('modal.bulk_topic.placeholder')}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
                    <Button onClick={handleSave} disabled={!text.trim()}>{t('action.save_topics')}</Button>
                </div>
            </div>
        </Modal>
    );
};
