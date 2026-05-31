import React from 'react';

const BlocksLibrary = ({ blocks, onDragStart, showHints = true }) => {
  // Показываем только правильные блоки (isCorrect !== false)
  const validBlocks = blocks.filter(b => b.isCorrect !== false);
  
  const getBlockStyle = (block) => {
    if (block.type === 'start') return { background: '#10b981' };
    if (block.type === 'end') return { background: '#8b5cf6' };
    if (block.type === 'decision') return { background: '#f59e0b' };
    return { background: '#3b82f6' };
  };

  return (
    <div style={{ width: '260px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0 }}>📦 Доступные блоки</h3>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Перетащи блок на схему</p>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {validBlocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Нет доступных блоков</div>
        ) : (
          validBlocks.map((block) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              style={{
                ...getBlockStyle(block),
                padding: '12px',
                marginBottom: '8px',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '13px',
                textAlign: 'center',
                cursor: 'grab',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {block.text}
              {showHints && block.hint && (
                <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>💡 {block.hint}</div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div style={{ padding: '12px', background: '#e0e7ff', borderTop: '1px solid #e2e8f0', fontSize: '12px' }}>
        💡 Совет: перетащи блок на свободное место на схеме
      </div>
    </div>
  );
};

export default BlocksLibrary;