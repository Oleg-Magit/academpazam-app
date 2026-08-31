import React, { useState } from 'react';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Modal } from '@/ui/Modal';
import { extractCourseTopics } from '@/core/services/ai';
import type { Topic } from '@/core/models/types';
import { saveTopic } from '@/core/db/db';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from '@/app/i18n/useTranslation';
import { Trash2, Upload, Brain, Check } from 'lucide-react';
import { courseBlueprintText } from './courseBlueprintI18n';
import { prepareCourseBlueprintProposals, toggleCourseBlueprintProposal, updateCourseBlueprintProposal, validateCourseBlueprintProposals, type CourseBlueprintProposal } from './courseBlueprintNormalizer';

interface UploadSyllabusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    courseId: string;
    courseName: string;
    existingTopics: Topic[];
}

export const UploadSyllabusModal: React.FC<UploadSyllabusModalProps> = ({ isOpen, onClose, onSave, courseId, courseName, existingTopics }) => {
    const { language } = useTranslation();
    const text = courseBlueprintText(language);
    const [file, setFile] = useState<File | null>(null);
    const [textSyllabus, setTextSyllabus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [previewTopics, setPreviewTopics] = useState<CourseBlueprintProposal[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);

    const resetState = () => {
        setFile(null);
        setTextSyllabus('');
        setPreviewTopics([]);
        setConsentGiven(false);
        setIsLoading(false);
        setIsAnalyzing(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setTextSyllabus('');
        }
    };

    const handleAnalyze = async () => {
        if ((file ? 1 : 0) + (textSyllabus.trim() ? 1 : 0) !== 1) return;
        setIsAnalyzing(true);
        try {
            const extracted = await extractCourseTopics(file, textSyllabus, courseName);
            if (extracted.length === 0) {
                alert(text.empty);
            } else {
                setPreviewTopics(prepareCourseBlueprintProposals(extracted, existingTopics));
            }
        } catch (err) {
            console.error(err);
            alert(err instanceof Error && err.message.includes('unavailable') ? text.unavailable : text.genericError);
        } finally {
        setIsAnalyzing(false);
        }
    };

    const handleSaveTopics = async () => {
        setIsLoading(true);
        try {
            const validated = validateCourseBlueprintProposals(previewTopics, existingTopics);
            if (validated.some(pt => pt.selected && !pt.isValid)) {
                alert(text.invalidTitle);
                return;
            }
            for (const pt of validated.filter(proposal => proposal.selected && proposal.isValid)) {
                const newTopic: Topic = {
                    id: uuidv4(),
                    courseId,
                    title: pt.title,
                    description: pt.description,
                    status: 'not_started',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await saveTopic(newTopic);
            }
            onSave();
            handleClose();
        } catch (err) {
            console.error(err);
            alert(text.saveError);
        } finally {
            setIsLoading(false);
        }
    };

    const removeTopic = (index: number) => {
        setPreviewTopics(prev => prev.filter((_, i) => i !== index));
    };

    const updateTopic = (index: number, field: 'title' | 'description', value: string) => {
        setPreviewTopics(prev => updateCourseBlueprintProposal(prev, index, field, value, existingTopics));
    };

    const toggleTopic = (index: number) => setPreviewTopics(prev => toggleCourseBlueprintProposal(prev, index));
    const hasSelectedInvalidTitle = previewTopics.some(topic => topic.selected && !topic.title.trim());

    const isPreviewMode = previewTopics.length > 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isPreviewMode ? text.review : text.title}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading || isAnalyzing}>
                        {text.cancel}
                    </Button>
                    {!isPreviewMode ? (
                        <Button 
                            variant="primary" 
                            onClick={handleAnalyze} 
                            disabled={(!file && !textSyllabus.trim()) || !consentGiven || isAnalyzing}
                        >
                            <Brain size={18} style={{ marginRight: '8px' }} />
                            {isAnalyzing ? text.analyzing : text.analyze}
                        </Button>
                    ) : (
                        <Button variant="primary" onClick={handleSaveTopics} disabled={isLoading || hasSelectedInvalidTitle}>
                            <Check size={18} style={{ marginRight: '8px' }} />
                            {isLoading ? text.saving : text.save}
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
                                <span style={{ fontWeight: 500 }}>{text.upload}</span>
                                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
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

                        <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={consentGiven} onChange={e => setConsentGiven(e.target.checked)} />
                            <span>{text.consent}</span>
                        </label>

                        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>{text.or}</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{text.paste}</label>
                            <textarea
                                value={textSyllabus}
                                onChange={(e) => { setTextSyllabus(e.target.value); if (e.target.value.trim()) setFile(null); }}
                                placeholder={text.placeholder}
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
                                <input type="checkbox" aria-label={text.select} checked={topic.selected} onChange={() => toggleTopic(idx)} style={{ marginTop: '10px' }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Input
                                        id={`topic-title-${idx}`}
                                        label={text.titleLabel}
                                        value={topic.title}
                                        onChange={(e) => updateTopic(idx, 'title', e.target.value)}
                                    />
                                    <Input
                                        id={`topic-desc-${idx}`}
                                        label={text.descriptionLabel}
                                        value={topic.description}
                                        onChange={(e) => updateTopic(idx, 'description', e.target.value)}
                                    />
                                </div>
                                {topic.isDuplicate && <div role="status" style={{ color: 'var(--color-warning)', fontSize: '0.8rem' }}>{text.duplicate}</div>}
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
