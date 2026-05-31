import React from 'react';
import { Handle, Position } from 'reactflow';

const ProcessNode = ({ data, selected }) => {
  const isTrap = data.isCorrect === false;

  const gradient = isTrap
    ? 'linear-gradient(140deg, #991b1b 0%, #ef4444 55%, #f87171 100%)'
    : 'linear-gradient(140deg, #1e40af 0%, #3b82f6 55%, #60a5fa 100%)';

  const glow = isTrap ? 'rgba(239,68,68,' : 'rgba(59,130,246,';
  const accent = isTrap ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.25)';

  const shadow = selected
    ? `0 0 0 2px white, 0 0 0 4px ${glow}0.9), 0 8px 24px ${glow}0.5)`
    : `0 4px 16px ${glow}0.3), 0 1px 3px rgba(0,0,0,0.15)`;

  const handleStyle = data.disableHandles
    ? { opacity: 0, pointerEvents: 'none', width: 8, height: 8 }
    : { background: 'white', width: 10, height: 10, border: `2px solid ${glow}0.5)`, borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' };

  return (
    <div style={{
      width: 150,
      height: 70,
      borderRadius: 12,
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxShadow: shadow,
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      overflow: 'visible',
    }}>
      {/* Top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '12px 12px 0 0',
        pointerEvents: 'none',
      }} />
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
        background: accent,
        borderRadius: '0 3px 3px 0',
      }} />

      <Handle type="target" position={Position.Top}    id="top"    style={{ ...handleStyle, top: -5,    left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -5, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ ...handleStyle, left: -5,   top: '50%', transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ ...handleStyle, right: -5,  top: '50%', transform: 'translateY(-50%)' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 16px', textAlign: 'center' }}>
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

export default ProcessNode;
