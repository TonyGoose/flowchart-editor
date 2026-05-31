import React from 'react';
import { Handle, Position } from 'reactflow';

const DataNode = ({ data, selected }) => {
  const isTrap = data.isCorrect === false;

  const gradient = isTrap
    ? 'linear-gradient(140deg, #991b1b 0%, #ef4444 55%, #f87171 100%)'
    : 'linear-gradient(140deg, #4338ca 0%, #6366f1 55%, #818cf8 100%)';

  const glow = isTrap ? 'rgba(239,68,68,' : 'rgba(99,102,241,';

  const filterStyle = selected
    ? `drop-shadow(0 0 0 2px white) drop-shadow(0 0 5px ${glow}0.9)) drop-shadow(0 6px 14px ${glow}0.5))`
    : `drop-shadow(0 4px 10px ${glow}0.4)) drop-shadow(0 1px 3px rgba(0,0,0,0.15))`;

  const handleStyle = data.disableHandles
    ? { opacity: 0, pointerEvents: 'none', width: 8, height: 8 }
    : { background: 'white', width: 10, height: 10, border: `2px solid ${glow}0.5)`, borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' };

  return (
    <div style={{
      width: 150,
      height: 70,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      filter: filterStyle,
      transition: 'filter 0.2s',
    }}>
      {/* Parallelogram shape */}
      <div style={{
        position: 'absolute', inset: 0,
        background: gradient,
        clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)',
        clipPath: 'polygon(14px 0%, 100% 0%, calc(100% - 14px) 100%, 0% 100%)',
        pointerEvents: 'none',
      }} />

      <Handle type="target" position={Position.Top}    id="top"    style={{ ...handleStyle, top: -5,    left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -5, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ ...handleStyle, left: -5,   top: '50%', transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ ...handleStyle, right: -5,  top: '50%', transform: 'translateY(-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', textAlign: 'center' }}>
        {isTrap && <span style={{ fontSize: 10, display: 'block', opacity: 0.85, marginBottom: 2, letterSpacing: '0.05em' }}>⚠ ЛОВУШКА</span>}
        <span style={{
          color: 'white', fontWeight: 600, fontSize: 12,
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          lineHeight: 1.35, wordBreak: 'break-word', display: 'block',
        }}>
          {data.label}
        </span>
      </div>
    </div>
  );
};

export default DataNode;
