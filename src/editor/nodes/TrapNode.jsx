import React from 'react';
import { Handle, Position } from 'reactflow';

const TrapNode = ({ data, selected }) => {
  const shadow = selected
    ? '0 0 0 2px white, 0 0 0 4px rgba(239,68,68,0.9), 0 8px 24px rgba(239,68,68,0.5)'
    : '0 4px 16px rgba(239,68,68,0.3), 0 1px 3px rgba(0,0,0,0.15)';

  return (
    <div style={{
      width: 150,
      height: 70,
      borderRadius: 12,
      background: 'linear-gradient(140deg, #7f1d1d 0%, #dc2626 55%, #f87171 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxShadow: shadow,
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      overflow: 'hidden',
      outline: '2px dashed rgba(255,255,255,0.4)',
      outlineOffset: -5,
    }}>
      {/* Top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '12px 12px 0 0',
        pointerEvents: 'none',
      }} />

      <Handle type="target" position={Position.Top} id="top" style={{ background: 'white', width: 10, height: 10, top: 0, left: '50%', transform: 'translateX(-50%)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'white', width: 10, height: 10, bottom: 0, left: '50%', transform: 'translateX(-50%)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '50%' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: 'white', width: 10, height: 10, left: 0, top: '50%', transform: 'translateY(-50%)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '50%' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: 'white', width: 10, height: 10, right: 0, top: '50%', transform: 'translateY(-50%)', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '50%' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 14px', textAlign: 'center' }}>
        <span style={{ fontSize: 10, display: 'block', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginBottom: 2 }}>⚠ ЛОВУШКА</span>
        <span style={{
          color: 'white', fontWeight: 600, fontSize: 12,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
          lineHeight: 1.3, wordBreak: 'break-word', display: 'block',
        }}>
          {data.label}
        </span>
        {data.hint && <span style={{ fontSize: 10, opacity: 0.7, display: 'block', marginTop: 2 }}>💡 {data.hint}</span>}
      </div>
    </div>
  );
};

export default TrapNode;
