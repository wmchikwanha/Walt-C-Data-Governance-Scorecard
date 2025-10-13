import React from 'react';
import { Dimension, DimensionScore, ResponseValue } from '../../types';
import { LockClosedIcon } from '@heroicons/react/24/solid';

interface QuestionPanelProps {
    dimension: Dimension;
    dimensionScore: DimensionScore;
    onUpdate: (dimensionId: number, updates: Partial<DimensionScore>) => void;
    status: 'Draft' | 'Submitted' | 'Locked';
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({ dimension, dimensionScore, onUpdate, status }) => {
    const isLocked = status !== 'Draft';

    const handleResponseChange = (subQuestionId: number, response: ResponseValue) => {
        const newResponses = dimensionScore.responses.map(r => 
            r.subQuestionId === subQuestionId ? { ...r, response } : r
        );
        onUpdate(dimension.id, { responses: newResponses });
    };

    const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate(dimension.id, { comments: e.target.value });
    };

    const responseOptions = [ResponseValue.YES, ResponseValue.WIP, ResponseValue.NO];

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col">
            {status === 'Submitted' && (
                <div className="mb-4 p-3 bg-blue-100 text-blue-800 border border-blue-300 rounded-md text-sm">
                    This assessment has been submitted and is read-only.
                </div>
            )}
            {status === 'Locked' && (
                <div className="mb-4 p-3 bg-gray-200 text-gray-800 border border-gray-400 rounded-md text-sm flex items-center">
                    <LockClosedIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                    This assessment has been locked by senior management and is read-only.
                </div>
            )}

            <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">{dimension.name}</h2>
            <div className="space-y-6 overflow-y-auto flex-grow pr-2">
                {dimension.subQuestions.map((sq, index) => {
                    const currentResponse = dimensionScore.responses.find(r => r.subQuestionId === sq.id)?.response;
                    return (
                        <div key={sq.id}>
                            <p className="font-semibold text-gray-700 mb-2">{index + 1}. {sq.text}</p>
                            <fieldset className="flex items-center space-x-4">
                                <legend className="sr-only">Response for question {index + 1}</legend>
                                {responseOptions.map(option => (
                                    <div key={option} className="flex items-center">
                                        <input
                                            id={`q-${dimension.id}-${sq.id}-${option}`}
                                            name={`q-${dimension.id}-${sq.id}`}
                                            type="radio"
                                            value={option}
                                            checked={currentResponse === option}
                                            onChange={() => handleResponseChange(sq.id, option)}
                                            disabled={isLocked}
                                            className="h-4 w-4 text-brand-primary focus:ring-brand-secondary border-gray-300 disabled:opacity-50"
                                        />
                                        <label htmlFor={`q-${dimension.id}-${sq.id}-${option}`} className="ml-2 block text-sm font-medium text-gray-700 disabled:opacity-50">{option}</label>
                                    </div>
                                ))}
                            </fieldset>
                        </div>
                    );
                })}
            </div>
            <div className="mt-6 pt-4 border-t">
                 <label htmlFor={`comments-${dimension.id}`} className="block text-sm font-bold text-gray-700 mb-2">Comments & Evidence</label>
                 <textarea
                    id={`comments-${dimension.id}`}
                    rows={4}
                    className="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary disabled:bg-slate-100"
                    placeholder="Provide any comments, evidence, or links to supporting documentation here."
                    value={dimensionScore.comments}
                    onChange={handleCommentsChange}
                    disabled={isLocked}
                 />
            </div>
        </div>
    );
};

export default QuestionPanel;