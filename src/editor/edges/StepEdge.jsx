import React from 'react';
import { getSmoothStepPath } from 'reactflow';

const StepEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: sourcePosition || 'bottom',
    targetPosition: targetPosition || 'top',
    borderRadius: 0,
  });

  let strokeColor = '#64748b';
  if (data?.label === 'да') strokeColor = '#10b981';
  if (data?.label === 'нет') strokeColor = '#ef4444';

  const markerId = `arrow-${id}`;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill={strokeColor} />
        </marker>
      </defs>
      {/* Широкая зона клика — pointerEvents="all" обязателен, иначе SVG игнорирует невидимый stroke */}
      <path d={edgePath} fill="none" stroke="rgba(0,0,0,0)" strokeWidth={18} pointerEvents="all" style={{ cursor: 'pointer' }} />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={data?.toWaypoint ? undefined : `url(#${markerId})`}
      />
      {data?.label && (
        <text fill={strokeColor} fontSize="11" fontWeight="bold">
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {data.label}
          </textPath>
        </text>
      )}
    </g>
  );
};

export default StepEdge;