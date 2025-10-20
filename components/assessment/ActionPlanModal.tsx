import React, { useState, useEffect, useCallback } from 'react';
import { Assessment, AssessmentTemplate, ResponseValue } from '../../types';
import Modal from '../shared/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, ClipboardDocumentIcon, LightBulbIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

type PlanStep = 'context' | 'generating' | 'displaying' | 'error';
type PriorityTag = 'QUICK WIN' | 'HIGH IMPACT' | 'FOUNDATIONAL';

interface PlanItem {
    id: number;
    priority: PriorityTag | null;
    action: string;
    explanation?: string;
    isLoadingExplanation?: boolean;
}

interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment;
  template: AssessmentTemplate;
}

const priorityStyles: Record<PriorityTag, { bg: string; text: string }> = {
    'QUICK WIN': { bg: 'bg-green-100', text: 'text-green-800' },
    'HIGH IMPACT': { bg: 'bg-amber-100', text: 'text-amber-800' },
    'FOUNDATIONAL': { bg: 'bg-blue-100', text: 'text-blue-800' },
};

const ActionPlanModal: React.FC<ActionPlanModalProps> = ({ isOpen, onClose, assessment, template }) => {
    const [step, setStep] = useState<PlanStep>('context');
    const [context, setContext] = useState({
        industry: 'Technology',
        departmentSize: '11-50',
        primaryGoal: 'Establish foundational policies'
    });
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [planHeader, setPlanHeader] = useState('');
    const [error, setError] = useState('');
    const { addNotification } = useNotification();

    useEffect(() => {
        if (isOpen) {
            // Reset to context step each time modal is opened
            setStep('context');
            setPlanItems([]);
            setError('');
        }
    }, [isOpen]);

    const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setContext(prev => ({...prev, [name]: value}));
    }

    const parsePlan = (text: string) => {
        const lines = text.split('\n');
        const items: PlanItem[] = [];
        let headerText = '';
        const priorityRegex = /^\[(QUICK WIN|HIGH IMPACT|FOUNDATIONAL)\]\s*(.*)$/;

        lines.forEach(line => {
            const trimmedLine = line.replace(/^-|^\*|\s\*/, '').trim();
            if (!trimmedLine) return;
            
            const match = trimmedLine.match(priorityRegex);
            if (match) {
                items.push({
                    id: items.length,
                    priority: match[1] as PriorityTag,
                    action: match[2].trim(),
                });
            } else if (trimmedLine.startsWith('###') || trimmedLine.startsWith('##') || trimmedLine.startsWith('#')) {
                if(!headerText) headerText = trimmedLine.replace(/#/g, '').trim();
            }
        });

        setPlanHeader(headerText || "Your 90-Day Action Plan");
        setPlanItems(items);
    };

    const generatePlan = useCallback(async () => {
        setStep('generating');
        setError('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const gaps = template.dimensions.map(dim => {
                const dimScore = assessment.scores.find(s => s.dimensionId === dim.id);
                if (!dimScore) return null;
                const weakResponses = dimScore.responses.filter(r => r.response === ResponseValue.NO || r.response === ResponseValue.WIP);
                if (weakResponses.length === 0) return null;
                return {
                    dimensionName: dim.name,
                    questions: weakResponses.map(r => ({
                        text: dim.subQuestions.find(sq => sq.id === r.subQuestionId)?.text,
                        response: r.response,
                    })).filter(q => q.text)
                }
            }).filter((g): g is NonNullable<typeof g> => g !== null && g.questions.length > 0);
            
            if (gaps.length === 0) {
                 setPlanHeader("Excellent Work!");
                 setPlanItems([{ id: 0, priority: null, action: "No significant gaps were found in your assessment. Continue to maintain your high standards in data governance." }]);
                 setStep('displaying');
                 return;
            }

            const prompt = `
You are an expert data governance consultant. Your task is to create a practical, actionable 90-day improvement plan for a department based on their self-assessment results and organizational context.

Organizational Context:
- Industry: ${context.industry}
- Department Size: ${context.departmentSize} people
- Primary Goal for this plan: ${context.primaryGoal}

Here are the areas where the department identified gaps (answered 'No' or 'Work in Progress'):
${gaps.map(gap => `
Dimension: "${gap.dimensionName}"
${gap.questions.map(q => `- Question: ${q.text} (Answer: ${q.response})`).join('\n')}
`).join('')}

Based on this context and these gaps, generate a structured 90-day action plan. The plan should have a main title. For each action item, PREPEND a priority tag from this exact list: [QUICK WIN], [HIGH IMPACT], [FOUNDATIONAL]. The tone should be encouraging and professional. Format the output using markdown. Focus only on the action items with their priority tags. Do not include phase headings like "Days 1-30".
            `;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            parsePlan(response.text);
            setStep('displaying');

        } catch (e) {
            console.error("Error generating action plan:", e);
            setError("Failed to generate the action plan. This may be due to network issues or content restrictions. Please try again.");
            setStep('error');
        }
    }, [assessment, template, context]);

    const handleExplain = useCallback(async (itemId: number) => {
        const item = planItems.find(p => p.id === itemId);
        if (!item) return;

        setPlanItems(items => items.map(i => i.id === itemId ? { ...i, isLoadingExplanation: true, explanation: undefined } : i));

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const prompt = `
            As a data governance expert, briefly explain why the following action item is important and provide one or two practical first steps to accomplish it. Keep the explanation concise (2-3 sentences).

            Action Item: "${item.action}"
            `;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setPlanItems(items => items.map(i => i.id === itemId ? { ...i, explanation: response.text } : i));

        } catch (e) {
            console.error("Error explaining item:", e);
            addNotification({ message: 'Could not generate explanation.', type: 'error' });
            setPlanItems(items => items.map(i => i.id === itemId ? { ...i, explanation: "Sorry, an error occurred while generating the explanation." } : i));
        } finally {
            setPlanItems(items => items.map(i => i.id === itemId ? { ...i, isLoadingExplanation: false } : i));
        }
    }, [planItems, addNotification]);
    
    const handleCopy = () => {
        const textToCopy = `${planHeader}\n\n${planItems.map(item => `${item.priority ? `[${item.priority}] ` : ''}${item.action}`).join('\n')}`;
        navigator.clipboard.writeText(textToCopy);
        addNotification({ message: 'Action plan copied to clipboard!', type: 'success' });
    }

    const renderContent = () => {
        switch (step) {
            case 'context':
                const labelClass = "block text-sm font-medium text-gray-700";
                const selectClass = "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md";
                return (
                    <div className="space-y-4 animate-fadeInUp">
                        <p className="text-sm text-gray-600">To create the most relevant action plan, please provide some context about your department.</p>
                        <div>
                            <label htmlFor="industry" className={labelClass}>Industry</label>
                            <select id="industry" name="industry" value={context.industry} onChange={handleContextChange} className={selectClass}>
                                <option>Technology</option><option>Finance</option><option>Healthcare</option><option>Retail</option><option>Manufacturing</option><option>Education</option><option>Government</option><option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="departmentSize" className={labelClass}>Department Size</label>
                            <select id="departmentSize" name="departmentSize" value={context.departmentSize} onChange={handleContextChange} className={selectClass}>
                                <option>1-10 people</option><option>11-50 people</option><option>51-200 people</option><option>200+ people</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="primaryGoal" className={labelClass}>Primary Goal for this Plan</label>
                            <select id="primaryGoal" name="primaryGoal" value={context.primaryGoal} onChange={handleContextChange} className={selectClass}>
                                <option>Establish foundational policies</option><option>Improve operational efficiency</option><option>Prepare for an audit</option><option>Reduce data-related risks</option><option>Enhance data for analytics</option>
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button onClick={generatePlan} className="flex items-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary">
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Generate Plan
                            </button>
                        </div>
                    </div>
                );
            case 'generating':
                return (
                    <div className="text-center p-8 animate-fadeIn">
                        <SparklesIcon className="h-12 w-12 text-brand-secondary mx-auto animate-pulse" />
                        <p className="mt-4 text-lg font-semibold text-gray-700">Generating your prioritized roadmap...</p>
                        <p className="text-sm text-gray-500 mt-1">Our AI is analyzing your gaps and context to create a tailored plan.</p>
                    </div>
                );
            case 'error':
                 return (
                    <div className="text-center p-8 animate-fadeIn">
                        <p className="text-red-600 bg-red-50 rounded-lg p-4">{error}</p>
                        <button onClick={generatePlan} className="mt-4 flex items-center mx-auto px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary">
                            <ArrowPathIcon className="h-5 w-5 mr-2" />
                            Try Again
                        </button>
                    </div>
                );
            case 'displaying':
                return (
                     <div className="animate-fadeIn">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{planHeader}</h3>
                        <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-3">
                           {planItems.map(item => (
                               <div key={item.id} className="p-4 bg-slate-50 rounded-lg border">
                                   <div className="flex items-start space-x-3">
                                        <div className="flex-grow">
                                            {item.priority && (
                                                <span className={`text-xs font-bold mr-2 px-2 py-0.5 rounded-full ${priorityStyles[item.priority].bg} ${priorityStyles[item.priority].text}`}>
                                                    {item.priority}
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-800">{item.action}</span>
                                        </div>
                                       {item.priority && (
                                         <button
                                            onClick={() => handleExplain(item.id)}
                                            disabled={item.isLoadingExplanation}
                                            className="p-1 text-gray-400 hover:text-brand-secondary disabled:text-gray-300 disabled:cursor-wait"
                                            title="Explain Further"
                                         >
                                            <LightBulbIcon className={`h-5 w-5 ${item.isLoadingExplanation ? 'animate-pulse' : ''}`} />
                                         </button>
                                       )}
                                   </div>
                                   {item.explanation && (
                                       <div className="mt-3 p-3 bg-white border-l-4 border-brand-secondary text-xs text-gray-600 rounded-r-md animate-fadeIn">
                                           {item.explanation}
                                       </div>
                                   )}
                               </div>
                           ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <p className="text-xs text-gray-500 italic">Powered by Gemini</p>
                            <button
                                onClick={handleCopy}
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 transition-transform active:scale-95"
                            >
                               <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                                Copy Plan
                            </button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI-Powered Action Plan">
            {renderContent()}
        </Modal>
    );
};

export default ActionPlanModal;
