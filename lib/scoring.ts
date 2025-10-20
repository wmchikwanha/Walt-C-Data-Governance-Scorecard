import { SubQuestionResponse, ResponseValue, DimensionScore } from '../types';
import { RESPONSE_POINTS } from '../constants';

export const calculateDimensionScore = (dimScore: DimensionScore): number | null => {
    if (dimScore.overriddenScore !== undefined && dimScore.overriddenScore !== null) {
        return dimScore.overriddenScore;
    }

    const answered = dimScore.responses.filter(r => r.response !== ResponseValue.UNANSWERED);
    if (answered.length === 0) return null;

    const totalPoints = answered.reduce((sum, r) => sum + RESPONSE_POINTS[r.response], 0);
    const maxPoints = answered.length * 100;
    
    return (totalPoints / maxPoints) * 100;
};

export const calculateOverallAssessmentScore = (scores: DimensionScore[]): number => {
    const dimensionScores = scores.map(dimScore => calculateDimensionScore(dimScore));
    const validScores = dimensionScores.filter((s): s is number => s !== null && !isNaN(s));

    if (validScores.length === 0) return 0;

    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    return totalScore / validScores.length;
};

export const comparePeriods = (a: string, b: string): number => {
    try {
        const [qA, yA] = a.split(' ');
        const [qB, yB] = b.split(' ');
        
        const yearA = parseInt(yA);
        const yearB = parseInt(yB);
        
        if (yearA !== yearB) {
            return yearA - yearB; // Sort by year first
        }
        
        const quarterA = parseInt(qA.substring(1));
        const quarterB = parseInt(qB.substring(1));
        
        return quarterA - quarterB; // Then sort by quarter
    } catch (e) {
        // Fallback for malformed strings
        return a.localeCompare(b);
    }
};