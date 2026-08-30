import React, { useState } from 'react';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Modal } from '@/ui/Modal';
import { extractCourseTopics } from '@/core/services/ai';
import type { Topic } from '@/core/models/types';
import { saveTopic } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Trash2, FileText, Upload, Brain, Check } from 'lucide-react';

interface UploadSyllabusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    courseId: string;
    courseName: string;
}

export const UploadSyllabusModal: React.FC<UploadSyllabusModalProps> = ({ isOpen, onClose, onSave, courseId, courseName }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [textSyllabus, setTextSyllabus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewTopics, setPreviewTopics] = useState<Partial<Topic>[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file && !textSyllabus.trim()) return;
        setIsAnalyzing(true);
        try {
            const extracted = await extractCourseTopics(file, textSyllabus, courseName);
            if (extracted.length === 0) {
                alert("ה-AI קרא את הקובץ אבל לא הצליח למצוא בו נושאי לימוד. נסה להעלות קובץ אחר או להדביק את הטקסט.");
            } else {
                setPreviewTopics(extracted);
            }
        } catch (err) {
            console.error(err);
            alert("Error analyzing syllabus");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveTopics = async () => {
        setIsLoading(true);
        try {
            for (const pt of previewTopics) {
                if (!pt.title?.trim()) continue;
                const newTopic: Topic = {
                    id: uuidv4(),
                    courseId,
                    title: pt.title,
                    description: pt.description || '',
                    status: 'not_started',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await saveTopic(newTopic);
            }
            onSave();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error saving topics");
        } finally {
            setIsLoading(false);
        }
    };

    const removeTopic = (index: number) => {
        setPreviewTopics(prev => prev.filter((_, i) => i !== index));
    };

    const updateTopic = (index: number, field: 'title' | 'description', value: string) => {
        setPreviewTopics(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const isPreviewMode = previewTopics.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isPreviewMode ? 'Review Topics' : 'Analyze Syllabus (AI)'}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading || isAnalyzing}>
                        {t('action.cancel')}
                    </Button>
                    {!isPreviewMode ? (
                        <Button 
                            variant="primary" 
                            onClick={handleAnalyze} 
                            disabled={(!file && !textSyllabus.trim()) || isAnalyzing}
                        >
                            <Brain size={18} style={{ marginRight: '8px' }} />
                            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSaveTopics} disabled={isLoading}>
                            <Check size={18} style={{ marginRight: '8px' }} />
                            {isLoading ? 'Saving...' : 'Approve & Save'}
                        </Button>
                    )}
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {!isPreviewMode ? (
                    <>
                        <div style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <Upload size={32} color="var(--color-text-secondary)" />
                                <span style={{ fontWeight: 500 }}>Upload PDF/Image</span>
                                <input type="file" accept=".pdf,image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                {file && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }} onClick={(e) => e.preventDefault()}>
                                        <span>{file.name}</span>
                                        <Button variant="ghost" onClick={() => setFile(null)} style={{ padding: '4px', height: 'auto', minHeight: 'auto' }}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>OR</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Paste Syllabus Text</label>
                            <textarea
                                value={textSyllabus}
                                onChange={(e) => setTextSyllabus(e.target.value)}
                                placeholder="Paste course topics here..."
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: 'var(--space-sm)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)'
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                        {previewTopics.map((topic, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Input
                                        id={`topic-title-${idx}`}
                                        label="Title"
                                        value={topic.title || ''}
                                        onChange={(e) => updateTopic(idx, 'title', e.target.value)}
                                    />
                                    <Input
                                        id={`topic-desc-${idx}`}
                                        label="Description"
                                        value={topic.description || ''}
                                        onChange={(e) => updateTopic(idx, 'description', e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" onClick={() => removeTopic(idx)} style={{ color: 'var(--color-danger)', marginTop: '24px' }}>
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
