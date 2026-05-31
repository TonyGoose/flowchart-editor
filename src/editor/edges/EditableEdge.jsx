import React, { useState } from 'react';

const GRID = 20;

const EditableEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, onUpdatePoints }) => {
  const points = data?.points || [];
  const [draggingIndex, setDraggingIndex] = useState(null);

  const getPath = () => {
    const allPoints = [{ x: sourceX, y: sourceY }, ...points, { x: targetX, y: targetY }];
    let path = `M ${allPoints[0].x} ${allPoints[0].y}`;
    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1];
      const curr = allPoints[i];
      if (prev.x !== curr.x && prev.y !== curr.y) {
        path += ` L ${curr.x} ${prev.y} L ${curr.x} ${curr.y}`;
      } else {
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    return path;
  };

  const addPoint = (index, x, y) => {
    const newPoints = [...points];
    newPoints.splice(index + 1, 0, { x, y });
    onUpdatePoints?.(id, newPoints);
  };

  const deletePoint = (index) => {
    const newPoints = points.filter((_, i) => i !== index);
    onUpdatePoints?.(id, newPoints);
  };

  const updatePoint = (index, x, y) => {
    const newPoints = [...points];
    newPoints[index] = { x, y };
    onUpdatePoints?.(id, newPoints);
  };

  const allPoints = [{ x: sourceX, y: sourceY }, ...points, { x: targetX, y: targetY }];
  const segments = [];
  for (let i = 0; i < allPoints.length - 1; i++) {
    segments.push({ start: allPoints[i], end: allPoints[i + 1], index: i });
  }

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
        d={getPath()}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
      />

      {/* Точки для добавления изгиба (серые) */}
      {selected &&
        segments.map((seg, idx) => {
          const midX = (seg.start.x + seg.end.x) / 2;
          const midY = (seg.start.y + seg.end.y) / 2;
          return (
            <circle
              key={`add-${idx}`}
              cx={midX}
              cy={midY}
              r="6"
              fill="#94a3b8"
              stroke="#fff"
              strokeWidth="1.5"
              style={{ cursor: 'crosshair' }}
              onDoubleClick={() => {
                const newX = Math.round(midX / GRID) * GRID;
                const newY = Math.round(midY / GRID) * GRID;
                addPoint(idx, newX, newY);
              }}
            />
          );
        })}

      {/* Точки изгиба (оранжевые) */}
      {selected &&
        points.map((point, idx) => (
          <circle
            key={`point-${idx}`}
            cx={point.x}
            cy={point.y}
            r="7"
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'move' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setDraggingIndex(idx);
              const startX = e.clientX;
              const startY = e.clientY;
              const onDrag = (moveEvent) => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;
                const newX = Math.round((point.x + dx) / GRID) * GRID;
                const newY = Math.round((point.y + dy) / GRID) * GRID;
                updatePoint(idx, newX, newY);
              };
              const onUp = () => {
                setDraggingIndex(null);
                window.removeEventListener('mousemove', onDrag);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onDrag);
              window.addEventListener('mouseup', onUp);
            }}
            onDoubleClick={() => deletePoint(idx)}
          />
        ))}

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

export default EditableEdge;