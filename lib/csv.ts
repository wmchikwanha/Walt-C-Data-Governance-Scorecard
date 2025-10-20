import { Assessment, AssessmentTemplate, Dimension, HeatmapData } from '../types';
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

export const exportHeatmapToCsv = (data: HeatmapData[], dimensions: Dimension[], filename?: string): { content: string, filename: string } => {
    const finalFilename = filename || `Data_Governance_Report_${new Date().toISOString().split('T')[0]}.csv`;
    if (data.length === 0 || dimensions.length === 0) {
        return { content: '', filename: finalFilename };
    }

    const headers = [
        'Department',
        'Overall Score',
        'Status',
        ...dimensions.map(d => d.name)
    ];

    const rows = data.map(row => {
        const rowData = [
            escapeCsvValue(row.departmentName),
            escapeCsvValue(row.overallScore.toFixed(1)),
            escapeCsvValue(row.status),
        ];
        dimensions.forEach(dim => {
            const scoreInfo = row.scores.get(dim.name);
            rowData.push(escapeCsvValue(scoreInfo ? scoreInfo.score.toFixed(1) : 'N/A'));
        });
        return rowData.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    if(filename) { // Trigger download if filename is provided
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', finalFilename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    return { content: csvContent, filename: finalFilename };
};


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
            
            const dimensionScoreValue = calculateDimensionScore(dimScore);

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