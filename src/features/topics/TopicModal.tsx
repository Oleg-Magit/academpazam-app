import React, { useState, useEffect } from 'react';
import { Modal } from '@/ui/Modal';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import type { Topic, TopicStatus } from '@/core/models/types';
import { saveTopic } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { Select } from '@/ui/Select';
import { useTranslation } from '@/app/i18n/useTranslation';

interface TopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    courseId: string;
    topicToEdit?: Topic | null;
}

export const TopicModal: React.FC<TopicModalProps> = ({
    isOpen, onClose, onSave, courseId, topicToEdit
}) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TopicStatus>('not_started');
    const [error, setError] = useState('');

    useEffect(() => {
        if (topicToEdit) {
            setTitle(topicToEdit.title);
            setDescription(topicToEdit.description || '');
            setStatus(topicToEdit.status);
        } else {
            setTitle('');
            setDescription('');
            setStatus('not_started');
        }
        setError('');
    }, [topicToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent | React.MouseEvent, closeModal = true) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError(t('error.name_required'));
            return;
        }

        const topic: Topic = {
            id: topicToEdit?.id || uuidv4(),
            courseId,
            title,
            description,
            status,
            createdAt: topicToEdit?.createdAt || Date.now(),
            updatedAt: Date.now(),
        };

        try {
            await saveTopic(topic);
            onSave();
            if (closeModal) {
                onClose();
            } else {
                // Reset for next entry
                setTitle('');
                setDescription('');
                setStatus('not_started');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to save topic');
        }
    };

    const STATUS_OPTIONS: { value: TopicStatus; label: string }[] = React.useMemo(() => [
        { value: 'not_started', label: t('status.not_started') },
        { value: 'in_progress', label: t('status.in_progress') },
        { value: 'done', label: t('status.completed') }
    ], [t]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={topicToEdit ? t('modal.edit_topic.title') : t('modal.add_topic.title')}
            footer={
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 'var(--space-md)',
                    flexWrap: 'wrap-reverse'
                }}>
                    <Button type="button" variant="ghost" onClick={onClose} style={{ flex: '1 1 100px' }}>{t('action.cancel')}</Button>
                    {!topicToEdit && (
                        <Button type="button" variant="secondary" style={{ flex: '1 1 100px' }} onClick={(e) => {
                            handleSubmit(e, false);
                        }}>{t('action.save_and_add')}</Button>
                    )}
                    <Button type="button" style={{ flex: '1 1 100px' }} onClick={(e) => handleSubmit(e, true)}>{t('action.save_topic')}</Button>
                </div>
            }
        >
            <form onSubmit={(e) => handleSubmit(e, true)}>
                <Input
                    id="topic-title"
                    name="topicTitle"
                    label={t('label.topic_title')}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    error={error}
                    required
                />
                <Input
                    id="topic-description"
                    name="topicDescription"
                    label={`${t('label.description')} (Optional)`}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
                <Select
                    id="topic-status"
                    name="topicStatus"
                    label={t('label.initial_status')}
                    value={status}
                    onChange={e => setStatus(e.target.value as TopicStatus)}
                    options={STATUS_OPTIONS}
                />
            </form>
        </Modal>
    );
};
