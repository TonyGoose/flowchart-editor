import React from 'react';
import { getSmoothStepPath } from 'reactflow';

const SmartEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected }) => {
  const sourcePos = sourcePosition || 'bottom';
  const targetPos = targetPosition || 'top';
  
  // Смещение для выхода из блока
  const getOffset = (pos, isSource) => {
    switch(pos) {
      case 'top': return { x: 0, y: isSource ? -5 : 5 };
      case 'bottom': return { x: 0, y: isSource ? 5 : -5 };
      case 'left': return { x: isSource ? -5 : 5, y: 0 };
      case 'right': return { x: isSource ? 5 : -5, y: 0 };
      default: return { x: 0, y: 0 };
    }
  };
  
  const sourceOffset = getOffset(sourcePos, true);
  const targetOffset = getOffset(targetPos, false);
  
  const startX = sourceX + sourceOffset.x;
  const startY = sourceY + sourceOffset.y;
  const endX = targetX + targetOffset.x;
  const endY = targetY + targetOffset.y;
  
  const [edgePath] = getSmoothStepPath({
    sourceX: startX,
    sourceY: startY,
    targetX: endX,
    targetY: endY,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    borderRadius: 15,
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
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
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

export default SmartEdge;