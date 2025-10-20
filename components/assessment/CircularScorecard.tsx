import React, { useState, useMemo } from 'react';
import { ScoreAndColor, Dimension, DimensionScore } from '../../types';
import { calculateDimensionScore } from '../../lib/scoring';
import { getScoreAndColor } from '../../constants';

interface CircularScorecardProps {
  dimensions: Dimension[];
  scores: DimensionScore[];
  onSegmentClick: (dimensionId: number) => void;
  activeDimensionId: number;
  assessmentStatus: 'Draft' | 'Submitted' | 'Locked';
}

const ScorecardSegment: React.FC<{
  rotation: number;
  strokeDasharray: string;
  color: string;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}> = ({ rotation, strokeDasharray, color, isActive, onMouseEnter, onMouseLeave, onClick }) => {
    
    return (
        <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke={color}
            strokeWidth="20"
            strokeDasharray={strokeDasharray}
            transform={`rotate(${rotation} 50 50)`}
            className="cursor-pointer"
            style={{
                transition: 'stroke 500ms ease-in-out, filter 300ms ease-in-out',
                filter: isActive ? 'drop-shadow(0px 0px 4px rgba(0, 82, 155, 0.7))' : 'none'
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        />
    );
};

const CircularScorecard: React.FC<CircularScorecardProps> = ({ dimensions, scores, onSegmentClick, activeDimensionId, assessmentStatus }) => {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const dimensionScoresAndColors = useMemo<ScoreAndColor[]>(() => {
    return dimensions.map(dim => {
      const dimScoreData = scores.find(s => s.dimensionId === dim.id);
      const scoreValue = dimScoreData ? calculateDimensionScore(dimScoreData) : null;
      return getScoreAndColor(scoreValue);
    });
  }, [dimensions, scores]);
  
  const totalSegments = dimensions.length;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / totalSegments;
  const gap = 5; // The length of the gap between segments
  const dash = segmentLength - gap;
  const strokeDasharray = `${dash} ${circumference - dash}`;
  
  const overallCompletion = useMemo(() => {
    if (!dimensionScoresAndColors || dimensionScoresAndColors.length === 0) return 0;
    const answeredCount = dimensionScoresAndColors.filter(s => s.color !== '#e0e0e0').length;
    return (answeredCount / totalSegments) * 100;
  }, [dimensionScoresAndColors, totalSegments]);

  const statusStyles: Record<'Draft' | 'Submitted' | 'Locked', string> = {
    Draft: 'bg-amber-100 text-amber-800',
    Submitted: 'bg-blue-100 text-blue-800',
    Locked: 'bg-gray-200 text-gray-800',
  };

  const handleKeyDown = (e: React.KeyboardEvent, dimensionId: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSegmentClick(dimensionId);
    }
  };


  return (
    <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">Overall Scorecard</h2>
        <div className="relative w-full max-w-xs">
             <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background circle to show where unanswered segments are */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f0f0f0" strokeWidth="20" />
                {dimensionScoresAndColors.map((score, index) => {
                    const dimensionId = dimensions[index].id;
                    return (
                        <ScorecardSegment
                            key={index}
                            rotation={(360 / totalSegments) * index}
                            strokeDasharray={strokeDasharray}
                            color={score.color}
                            isActive={activeDimensionId === dimensionId}
                            onMouseEnter={() => setHoveredSegment(index)}
                            onMouseLeave={() => setHoveredSegment(null)}
                            onClick={() => onSegmentClick(dimensionId)}
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                 <div key={hoveredSegment ?? 'overall'} className="animate-fadeIn space-y-1">
                    {hoveredSegment !== null ? (
                        <>
                            <p className="text-sm font-bold text-gray-800 truncate px-4">{dimensions[hoveredSegment].name}</p>
                            <p className="text-4xl font-extrabold text-brand-primary">{dimensionScoresAndColors[hoveredSegment].score.toFixed(0)}%</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[assessmentStatus]}`}>
                                Status: {assessmentStatus}
                            </span>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-semibold text-gray-500">Completion</p>
                            <p className="text-4xl font-extrabold text-brand-primary">{overallCompletion.toFixed(0)}%</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[assessmentStatus]}`}>
                                Status: {assessmentStatus}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
        <div className="mt-6 w-full">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Dimensions</h3>
            <ul role="listbox" aria-label="Assessment Dimensions" className="space-y-1">
                {dimensions.map((dim, index) => {
                    const isActive = activeDimensionId === dim.id;
                    return (
                        <li
                            key={dim.id}
                            role="option"
                            aria-selected={isActive}
                            tabIndex={0}
                            onClick={() => onSegmentClick(dim.id)}
                            onFocus={() => setHoveredSegment(index)}
                            onBlur={() => setHoveredSegment(null)}
                            onKeyDown={(e) => handleKeyDown(e, dim.id)}
                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                                isActive
                                    ? 'bg-blue-100 text-brand-primary shadow-inner'
                                    : 'text-gray-700 hover:bg-slate-100 hover:scale-[1.02] active:scale-95'
                            }`}
                        >
                           <div className="flex items-center">
                             <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${dimensionScoresAndColors[index].colorClass}`} aria-hidden="true"></span>
                             <span className={`text-sm font-semibold truncate ${isActive ? 'text-brand-primary' : 'text-gray-800'}`}>{dim.name}</span>
                           </div>
                           <span className={`text-sm font-bold ml-2 ${isActive ? 'text-brand-primary' : 'text-gray-600'}`}>
                               {dimensionScoresAndColors[index].score.toFixed(0)}%
                           </span>
                        </li>
                    );
                })}
             </ul>
        </div>
    </div>
  );
};

export default CircularScorecard;