import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 100,
  height = 25,
  strokeColor = '#00529B',
  strokeWidth = 1.5,
  className = '',
}) => {
  if (!data || data.length < 2) {
    return <div className="text-xs text-center text-gray-400 italic h-[25px] flex items-center justify-center">Not enough data</div>;
  }

  const maxVal = 100;
  const minVal = 0;
  const range = maxVal - minVal;
  const effectiveRange = range === 0 ? 1 : range;

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - minVal) / effectiveRange) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  
  const lastPoint = points.split(' ').pop()?.split(',');
  const lastX = lastPoint ? parseFloat(lastPoint[0]) : 0;
  const lastY = lastPoint ? parseFloat(lastPoint[1]) : 0;

  const title = `Scores (oldest to newest): ${data.map(d => d.toFixed(0)).join(', ')}`;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-label={title}
    >
      <title>{title}</title>
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        points={points}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={strokeWidth * 1.5} fill={strokeColor} />
    </svg>
  );
};

export default Sparkline;