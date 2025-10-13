import { Assessment, AssessmentTemplate } from '../types';
import { calculateDimensionScore } from './scoring';

const escapeCsvValue = (value: any): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return str;
};

interface ExportData {
    assessment: Assessment;
    template: AssessmentTemplate;
}

export const exportAssessmentsToCsv = (exportData: ExportData[], filename: string) => {
    if (exportData.length === 0) return;

    const headers = [
        'Department Name',
        'Assessment Period',
        'Assessment Status',
        'Template Name',
        'Dimension Name',
        'Dimension Score (%)',
        'Sub-Question Text',
        'Response',
        'Dimension Comments',
    ];

    const rows = exportData.flatMap(({ assessment, template }) => {
        return assessment.scores.flatMap(dimScore => {
            const dimension = template.dimensions.find(d => d.id === dimScore.dimensionId);
            if (!dimension) return [];
            
            const dimensionScoreValue = calculateDimensionScore(dimScore.responses);

            return dimScore.responses.map(response => {
                const subQuestion = dimension.subQuestions.find(sq => sq.id === response.subQuestionId);
                if (!subQuestion) return null;

                return [
                    escapeCsvValue(assessment.departmentName),
                    escapeCsvValue(assessment.period),
                    escapeCsvValue(assessment.status),
                    escapeCsvValue(template.name),
                    escapeCsvValue(dimension.name),
                    escapeCsvValue(dimensionScoreValue !== null ? dimensionScoreValue.toFixed(1) : 'N/A'),
                    escapeCsvValue(subQuestion.text),
                    escapeCsvValue(response.response),
                    escapeCsvValue(dimScore.comments),
                ].join(',');
            }).filter((row): row is string => row !== null);
        });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
