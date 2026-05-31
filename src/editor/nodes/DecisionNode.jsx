import React from 'react';
import { Handle, Position } from 'reactflow';

const DecisionNode = ({ data, selected }) => {
  const handleStyle = data.disableHandles
    ? { opacity: 0, pointerEvents: 'none', width: 8, height: 8 }
    : { background: 'white', width: 10, height: 10, border: '2px solid rgba(245,158,11,0.5)', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' };

  return (
    <div style={{
      width: 150,
      height: 70,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      filter: selected
        ? 'drop-shadow(0 0 0 2px white) drop-shadow(0 0 5px rgba(245,158,11,0.9)) drop-shadow(0 6px 14px rgba(245,158,11,0.5))'
        : 'drop-shadow(0 4px 10px rgba(245,158,11,0.4)) drop-shadow(0 1px 3px rgba(0,0,0,0.15))',
      transition: 'filter 0.2s',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(140deg, #b45309 0%, #f59e0b 55%, #fcd34d 100%)',
        clipPath: 'polygon(50% 3px, calc(100% - 4px) 50%, 50% calc(100% - 3px), 4px 50%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 50%)',
        clipPath: 'polygon(50% 3px, calc(100% - 4px) 50%, 50% calc(100% - 3px), 4px 50%)',
        pointerEvents: 'none',
      }} />

      <Handle type="target" position={Position.Top}    id="top"    style={{ ...handleStyle, top: -5,    left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -5, left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ ...handleStyle, right: -5,  top: '50%',  transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Left}   id="left"   style={{ ...handleStyle, left: -5,   top: '50%',  transform: 'translateY(-50%)' }} />

      <span style={{
        position: 'relative', zIndex: 1,
        color: 'white', fontWeight: 700, fontSize: 11,
        textAlign: 'center', padding: '0 28px',
        textShadow: '0 1px 3px rgba(0,0,0,0.35)',
        lineHeight: 1.3, wordBreak: 'break-word', display: 'block',
      }}>
        {data.label}
      </span>
    </div>
  );
};

export default DecisionNode;
