
import React, { useState, useEffect } from 'react';
import { AssessmentTemplate, Dimension, SubQuestion } from '../../types';
import { api } from '../../data';
import { useNotification } from '../../contexts/NotificationContext';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

interface TemplateEditorProps {
    template: AssessmentTemplate | null;
    onSave: () => void;
    onCancel: () => void;
}

// FIX: Updated new item creation to use temporary negative IDs to conform to types.
const newSubQuestion = (): SubQuestion => ({ id: -(Date.now() * Math.random()), text: '' });
// FIX: Updated new item creation to use temporary negative IDs to conform to types.
const newDimension = (): Dimension => ({ id: -(Date.now() * Math.random()), name: '', subQuestions: [newSubQuestion()] });

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
    // FIX: The `useState` call is now type-safe as `newDimension()` returns a valid `Dimension`.
    const [formData, setFormData] = useState<Partial<AssessmentTemplate>>(template || { name: '', description: '', dimensions: [newDimension()] });
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDimensionChange = (dimIndex: number, newName: string) => {
        const newDimensions = [...(formData.dimensions || [])];
        newDimensions[dimIndex].name = newName;
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const handleQuestionChange = (dimIndex: number, qIndex: number, newText: string) => {
        const newDimensions = [...(formData.dimensions || [])];
        newDimensions[dimIndex].subQuestions[qIndex].text = newText;
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const addDimension = () => {
        setFormData({ ...formData, dimensions: [...(formData.dimensions || []), newDimension()] });
    };

    const removeDimension = (dimIndex: number) => {
        const newDimensions = [...(formData.dimensions || [])];
        newDimensions.splice(dimIndex, 1);
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const addQuestion = (dimIndex: number) => {
        const newDimensions = [...(formData.dimensions || [])];
        // FIX: Pushing a valid `SubQuestion` object, resolving type error.
        newDimensions[dimIndex].subQuestions.push(newSubQuestion());
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const removeQuestion = (dimIndex: number, qIndex: number) => {
        const newDimensions = [...(formData.dimensions || [])];
        newDimensions[dimIndex].subQuestions.splice(qIndex, 1);
        setFormData({ ...formData, dimensions: newDimensions });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Re-assign stable IDs on save
            // FIX: Updated save logic to handle temporary negative IDs.
            const finalDimensions = formData.dimensions?.map((dim, dimIndex) => ({
                ...dim,
                id: dim.id > 0 ? dim.id : dimIndex + 1, // Use existing positive ID or generate new one
                subQuestions: dim.subQuestions.map((sq, qIndex) => ({
                    ...sq,
                    id: sq.id > 0 ? sq.id : qIndex + 1, // Use existing positive ID or generate new one
                })),
            })) || [];

            const templateToSave: AssessmentTemplate = {
                id: formData.id || `t-${Date.now()}`,
                name: formData.name!,
                description: formData.description!,
                dimensions: finalDimensions,
            };

            await api.saveTemplate(templateToSave);
            addNotification({ message: 'Template saved successfully!', type: 'success' });
            onSave();
        } catch (error) {
            addNotification({ message: 'Failed to save template.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                 <button type="button" onClick={onCancel} className="flex items-center text-sm font-semibold text-brand-primary hover:underline mb-4">
                    <ArrowLeftIcon className="h-4 w-4 mr-1"/>
                    Back to Templates
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{template ? 'Edit Template' : 'Create New Template'}</h1>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-sm border space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Template Name</label>
                    <input type="text" name="name" id="name" required value={formData.name} onChange={handleTemplateChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" id="description" rows={3} required value={formData.description} onChange={handleTemplateChange} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                </div>
            </div>

            {formData.dimensions?.map((dim, dimIndex) => (
                // FIX: Use `dim.id` for the key, which is now always a unique number.
                <div key={dim.id} className="p-6 bg-white rounded-lg shadow-sm border animate-fadeInUp">
                    <div className="flex justify-between items-center mb-4">
                        <input type="text" placeholder={`Dimension ${dimIndex + 1} Name`} required value={dim.name} onChange={(e) => handleDimensionChange(dimIndex, e.target.value)} className="text-lg font-semibold text-gray-800 border-b-2 w-full focus:outline-none focus:border-brand-primary" />
                        <button type="button" onClick={() => removeDimension(dimIndex)} className="ml-4 p-1 text-gray-400 hover:text-status-red">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {dim.subQuestions.map((sq, qIndex) => (
                            // FIX: Use `sq.id` for the key. `tempId` is no longer needed.
                            <div key={sq.id} className="flex items-center space-x-2">
                                <span className="text-gray-500">{qIndex + 1}.</span>
                                <input type="text" placeholder="Enter question text" required value={sq.text} onChange={(e) => handleQuestionChange(dimIndex, qIndex, e.target.value)} className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm" />
                                <button type="button" onClick={() => removeQuestion(dimIndex, qIndex)} className="p-1 text-gray-400 hover:text-status-red" disabled={dim.subQuestions.length <= 1}>
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addQuestion(dimIndex)} className="mt-4 text-sm font-semibold text-brand-primary hover:underline flex items-center">
                        <PlusIcon className="h-4 w-4 mr-1" /> Add Question
                    </button>
                </div>
            ))}

            <div className="flex justify-between items-center">
                <button type="button" onClick={addDimension} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 flex items-center">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Dimension
                </button>
                <div className="flex items-center space-x-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary disabled:bg-slate-400">
                        {isSaving ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TemplateEditor;
