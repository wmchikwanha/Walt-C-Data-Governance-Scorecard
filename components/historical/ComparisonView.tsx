import React, { useMemo } from 'react';
import { Assessment, AssessmentTemplate } from '../../types';
import { getScoreAndColor } from '../../constants';
import { calculateDimensionScore } from '../../lib/scoring';
import { ArrowUpIcon, ArrowDownIcon, MinusSmallIcon } from '@heroicons/react/24/solid';

interface AssessmentWithTemplate {
    assessment: Assessment;
    template: AssessmentTemplate;
}

interface ComparisonViewProps {
  assessmentsWithTemplates: AssessmentWithTemplate[];
  onShowChangelog: () => void;
}

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'same' | null }> = ({ trend }) => {
    if (trend === 'up') {
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
    }
    if (trend === 'down') {
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
    }
    if (trend === 'same') {
        return <MinusSmallIcon className="h-5 w-5 text-gray-500" />;
    }
    return null;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ assessmentsWithTemplates, onShowChangelog }) => {
    const periods = useMemo(() => assessmentsWithTemplates.map(a => a.assessment.period), [assessmentsWithTemplates]);
  
    const comparisonData = useMemo(() => {
        if (assessmentsWithTemplates.length === 0) return [];
        
        const latestTemplate = assessmentsWithTemplates[assessmentsWithTemplates.length - 1].template;

        return latestTemplate.dimensions.map(masterDim => {
            const scoresByPeriod: ({ score: number; colorClass: string; trend: 'up' | 'down' | 'same' | null; rawScore: number | null })[] = [];
            
            assessmentsWithTemplates.forEach(({ assessment, template }, index) => {
                const matchingDim = template.dimensions.find(d => d.name === masterDim.name);
                const dimScoreData = matchingDim ? assessment.scores.find(s => s.dimensionId === matchingDim.id) : undefined;
                
                const score = dimScoreData ? calculateDimensionScore(dimScoreData.responses) : null;
                const { colorClass } = getScoreAndColor(score);

                let trend: 'up' | 'down' | 'same' | null = null;
                if (index > 0) {
                    const prevData = assessmentsWithTemplates[index-1];
                    const prevMatchingDim = prevData.template.dimensions.find(d => d.name === masterDim.name);
                    const prevDimScoreData = prevMatchingDim ? prevData.assessment.scores.find(s => s.dimensionId === prevMatchingDim.id) : undefined;
                    const prevScore = prevDimScoreData ? calculateDimensionScore(prevDimScoreData.responses) : null;

                    if (score !== null && prevScore !== null) {
                        if(score > prevScore) trend = 'up';
                        else if (score < prevScore) trend = 'down';
                        else trend = 'same';
                    }
                }

                scoresByPeriod.push({ score: score ?? 0, colorClass, trend, rawScore: score });
            });
            return {
                dimensionName: masterDim.name,
                scores: scoresByPeriod
            };
        });
    }, [assessmentsWithTemplates]);

  if (assessmentsWithTemplates.length < 2) {
      return (
          <div className="text-center py-10">
              <h3 className="text-xl font-semibold text-gray-700">Not Enough Data for Comparison</h3>
              <p className="text-gray-500 mt-2">At least two submitted assessments are needed to compare history.</p>
               <button onClick={onShowChangelog} className="mt-4 text-sm font-semibold text-brand-primary hover:underline">
                    View Detailed Changelog &rarr;
                </button>
          </div>
      );
  }

  return (
    <div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimension</th>
                        {periods.map(period => (
                             <th key={period} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                               {period}
                             </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {comparisonData.map(row => (
                        <tr key={row.dimensionName}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.dimensionName}</td>
                            {row.scores.map((scoreInfo, index) => (
                                <td key={periods[index]} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className={`font-bold px-2 py-1 rounded ${scoreInfo.colorClass} text-white`}>
                                            {scoreInfo.rawScore !== null ? `${scoreInfo.score.toFixed(0)}%` : 'N/A'}
                                        </span>
                                        <TrendIndicator trend={scoreInfo.trend} />
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-6 text-right">
             <button onClick={onShowChangelog} className="text-sm font-semibold text-brand-primary hover:underline">
                View Detailed Changelog &rarr;
            </button>
        </div>
    </div>
  );
};

export default ComparisonView;