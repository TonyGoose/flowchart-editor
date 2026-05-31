import React, { useState } from 'react';
import { getSmoothStepPath, getBezierPath } from 'reactflow';

const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, edgeStyle }) => {
  const [waypoints, setWaypoints] = useState(data?.waypoints || []);
  
  // Строим путь с учётом точек изгиба
  const getPathWithWaypoints = () => {
    if (!waypoints.length) {
      if (edgeStyle === 'step') {
        const [path] = getSmoothStepPath({
          sourceX, sourceY, targetX, targetY,
          sourcePosition: sourcePosition || 'bottom',
          targetPosition: targetPosition || 'top',
          borderRadius: 0
        });
        return path;
      } else {
        const [path] = getBezierPath({
          sourceX, sourceY, targetX, targetY,
          sourcePosition: sourcePosition || 'bottom',
          targetPosition: targetPosition || 'top',
        });
        return path;
      }
    }
    
    // Строим путь через точки изгиба
    let points = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    let path = '';
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];
      if (i === 0) path += `M ${from.x} ${from.y} `;
      // Г-образный изгиб между точками
      if (Math.abs(from.x - to.x) > 20 && Math.abs(from.y - to.y) > 20) {
        path += `L ${to.x} ${from.y} L ${to.x} ${to.y} `;
      } else {
        path += `L ${to.x} ${to.y} `;
      }
    }
    return path;
  };
  
  let strokeColor = '#64748b';
  if (data?.label === 'да') strokeColor = '#10b981';
  if (data?.label === 'нет') strokeColor = '#ef4444';
  
  const markerId = `arrow-${id}`;
  
  // Добавление новой точки изгиба
  const addWaypoint = (x, y) => {
    const newWaypoints = [...waypoints, { x, y }];
    setWaypoints(newWaypoints);
    if (data?.onUpdateWaypoints) data.onUpdateWaypoints(id, newWaypoints);
  };
  
  // Удаление точки изгиба
  const removeWaypoint = (index) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(newWaypoints);
    if (data?.onUpdateWaypoints) data.onUpdateWaypoints(id, newWaypoints);
  };
  
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill={strokeColor} />
        </marker>
      </defs>
      <path
        id={id}
        d={getPathWithWaypoints()}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
      />
      
      {/* Точки изгиба - отображаются только при выделении */}
      {selected && waypoints.map((wp, idx) => (
        <g key={`wp-${idx}`}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r="6"
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'move' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const onDrag = (moveEvent) => {
                const newX = wp.x + (moveEvent.clientX - e.clientX);
                const newY = wp.y + (moveEvent.clientY - e.clientY);
                const newWaypoints = [...waypoints];
                newWaypoints[idx] = { x: newX, y: newY };
                setWaypoints(newWaypoints);
                if (data?.onUpdateWaypoints) data.onUpdateWaypoints(id, newWaypoints);
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onDrag);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onDrag);
              window.addEventListener('mouseup', onUp);
            }}
            onDoubleClick={() => removeWaypoint(idx)}
          />
          <circle
            cx={wp.x}
            cy={wp.y}
            r="12"
            fill="transparent"
            stroke="none"
            style={{ cursor: 'move' }}
          />
        </g>
      ))}
      
      {/* Кнопка добавления точки изгиба на середине */}
      {selected && (
        <g>
          <circle
            cx={(sourceX + targetX) / 2}
            cy={(sourceY + targetY) / 2 - 20}
            r="8"
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              const newX = (sourceX + targetX) / 2;
              const newY = (sourceY + targetY) / 2 - 20;
              addWaypoint(newX, newY);
            }}
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2 - 20}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            style={{ pointerEvents: 'none' }}
          >+</text>
        </g>
      )}
      
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

export default CustomEdge;