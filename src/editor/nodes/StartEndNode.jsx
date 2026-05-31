import React from 'react';
import { Handle, Position } from 'reactflow';

const StartEndNode = ({ data, selected }) => {
  const isStart = data.type === 'start';

  const gradient = isStart
    ? 'linear-gradient(140deg, #047857 0%, #10b981 55%, #34d399 100%)'
    : 'linear-gradient(140deg, #5b21b6 0%, #8b5cf6 55%, #a78bfa 100%)';

  const glow = isStart ? 'rgba(16,185,129,' : 'rgba(139,92,246,';

  const shadow = selected
    ? `0 0 0 2px white, 0 0 0 4px ${glow}0.9), 0 8px 24px ${glow}0.5)`
    : `0 4px 16px ${glow}0.35), 0 1px 3px rgba(0,0,0,0.15)`;

  const handleStyle = data.disableHandles
    ? { opacity: 0, pointerEvents: 'none', width: 8, height: 8 }
    : { background: 'white', width: 10, height: 10, border: `2px solid ${glow}0.5)`, borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' };

  return (
    <div style={{
      width: 150,
      height: 70,
      borderRadius: 35,
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxShadow: shadow,
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
      overflow: 'hidden',
    }}>
      {/* Inner top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '35px 35px 0 0',
        pointerEvents: 'none',
      }} />

      <Handle type="target" position={Position.Top} id="top" style={{ ...handleStyle, top: 0, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="target" position={Position.Left} id="left" style={{ ...handleStyle, left: 0, top: '50%', transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: 0, top: '50%', transform: 'translateY(-50%)' }} />

      <span style={{
        position: 'relative', zIndex: 1,
        color: 'white', fontWeight: 700, fontSize: 13,
        letterSpacing: '0.04em', textShadow: '0 1px 3px rgba(0,0,0,0.25)',
        padding: '0 16px', textAlign: 'center',
      }}>
        {data.label}
      </span>
    </div>
  );
};

export default StartEndNode;
