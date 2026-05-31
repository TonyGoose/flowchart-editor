import React from 'react';
import { Handle, Position } from 'reactflow';

const WaypointNode = ({ selected, data }) => {
  // disableHandles=true → студент/предпросмотр: ручки скрыты, но в DOM (нужны ReactFlow для маршрутизации)
  const handleStyle = data?.disableHandles
    ? { opacity: 0, pointerEvents: 'none', width: 8, height: 8 }
    : { background: '#6366f1', width: 12, height: 12, border: '2px solid white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', zIndex: 10 };

  const isEditor = !data?.disableHandles;

  return (
    <div
      title={isEditor ? 'Точка соединения — тяни от кружков чтобы подключить блок' : ''}
      style={{
        width: 16, height: 16,
        borderRadius: '50%',
        background: isEditor
          ? (selected ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#6366f1,#818cf8)')
          : '#475569',
        border: isEditor
          ? `2px solid ${selected ? 'white' : 'rgba(255,255,255,0.7)'}`
          : '2px solid #94a3b8',
        boxShadow: isEditor
          ? (selected ? '0 0 0 4px rgba(99,102,241,0.35),0 2px 8px rgba(0,0,0,0.25)' : '0 2px 6px rgba(99,102,241,0.4)')
          : 'none',
        cursor: isEditor ? 'pointer' : 'default',
        position: 'relative',
        transition: 'all 0.15s',
      }}
    >
      <Handle type="target" position={Position.Top}    id="top"
        style={{ ...handleStyle, top: -5,    left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ ...handleStyle, bottom: -5, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="target" position={Position.Left}   id="left"
        style={{ ...handleStyle, left: -5,   top: '50%',  transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Right}  id="right"
        style={{ ...handleStyle, right: -5,  top: '50%',  transform: 'translateY(-50%)' }} />
    </div>
  );
};

export default WaypointNode;
