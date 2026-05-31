import React from 'react';

const blockTypes = [
  {
    type: 'start', label: 'НАЧАЛО', isCorrect: true, hint: 'Начало алгоритма',
    preview: { shape: 'pill', gradient: 'linear-gradient(140deg, #047857, #10b981, #34d399)' },
  },
  {
    type: 'end', label: 'КОНЕЦ', isCorrect: true, hint: 'Конец алгоритма',
    preview: { shape: 'pill', gradient: 'linear-gradient(140deg, #5b21b6, #8b5cf6, #a78bfa)' },
  },
  {
    type: 'process', label: 'ПРОЦЕСС', isCorrect: true, hint: 'Обычный блок действия',
    preview: { shape: 'rect', gradient: 'linear-gradient(140deg, #1e40af, #3b82f6, #60a5fa)' },
  },
  {
    type: 'decision', label: 'РЕШЕНИЕ', isCorrect: true, hint: 'Условный блок (ромб)',
    preview: { shape: 'diamond', gradient: 'linear-gradient(140deg, #b45309, #f59e0b, #fcd34d)' },
  },
  {
    type: 'waypoint', label: 'ТОЧКА', isCorrect: true, hint: 'Точка возврата для петель',
    preview: { shape: 'waypoint' },
  },
  {
    type: 'predefined_process', label: 'ПОДПРОГРАММА', isCorrect: true, hint: 'Вызов подпрограммы или функции',
    preview: { shape: 'predefined', gradient: 'linear-gradient(140deg, #0e7490, #0891b2, #38bdf8)' },
  },
  {
    type: 'data', label: 'ДАННЫЕ', isCorrect: true, hint: 'Ввод или вывод данных (параллелограмм)',
    preview: { shape: 'parallelogram', gradient: 'linear-gradient(140deg, #4338ca, #6366f1, #818cf8)' },
  },
  {
    type: 'trap', label: 'ЛОВУШКА', isCorrect: false, hint: 'Неправильный блок — снижает баллы',
    preview: { shape: 'trap', gradient: 'linear-gradient(140deg, #7f1d1d, #dc2626, #f87171)' },
  },
];

const BlockPreview = ({ preview, label, isCorrect }) => {
  const base = {
    width: '100%', height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: preview.gradient, position: 'relative', overflow: 'hidden',
    color: 'white', fontWeight: 600, fontSize: 12,
    textShadow: '0 1px 2px rgba(0,0,0,0.25)',
  };

  if (preview.shape === 'pill') {
    return (
      <div style={{ ...base, borderRadius: 22 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.16),transparent)', borderRadius: '22px 22px 0 0', pointerEvents: 'none' }} />
        {label}
      </div>
    );
  }

  if (preview.shape === 'rect') {
    return (
      <div style={{ ...base, borderRadius: 8 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.14),transparent)', borderRadius: '8px 8px 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, background: 'rgba(255,255,255,0.3)', borderRadius: '0 3px 3px 0' }} />
        <span style={{ zIndex: 1 }}>{label}</span>
      </div>
    );
  }

  if (preview.shape === 'diamond') {
    return (
      <div style={{ ...base, background: 'transparent', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, background: preview.gradient, clipPath: 'polygon(50% 4px, calc(100% - 5px) 50%, 50% calc(100% - 4px), 5px 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,255,255,0.16),transparent)', clipPath: 'polygon(50% 4px, calc(100% - 5px) 50%, 50% calc(100% - 4px), 5px 50%)', pointerEvents: 'none' }} />
        <span style={{ position: 'relative', zIndex: 1, padding: '0 24px', textAlign: 'center' }}>{label}</span>
      </div>
    );
  }

  if (preview.shape === 'waypoint') {
    return (
      <div style={{ ...base, background: '#f8fafc', height: 44, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
        }} />
      </div>
    );
  }

  if (preview.shape === 'predefined') {
    return (
      <div style={{ ...base, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.14),transparent)', borderRadius: '4px 4px 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.4)' }} />
        <div style={{ position: 'absolute', right: 10, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.4)' }} />
        <span style={{ zIndex: 1 }}>{label}</span>
      </div>
    );
  }

  if (preview.shape === 'parallelogram') {
    return (
      <div style={{ ...base, background: 'transparent', overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, background: preview.gradient, clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,255,255,0.16),transparent)', clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)', pointerEvents: 'none' }} />
        <span style={{ position: 'relative', zIndex: 1, padding: '0 20px', textAlign: 'center' }}>{label}</span>
      </div>
    );
  }

  if (preview.shape === 'trap') {
    return (
      <div style={{ ...base, borderRadius: 8, outline: '2px dashed rgba(255,255,255,0.35)', outlineOffset: -4 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg,rgba(255,255,255,0.1),transparent)', borderRadius: '8px 8px 0 0', pointerEvents: 'none' }} />
        <span style={{ zIndex: 1 }}>⚠ {label}</span>
      </div>
    );
  }

  return null;
};

const Sidebar = () => {
  const onDragStart = (event, block) => {
    event.dataTransfer.setData('type', block.type === 'trap' ? 'trap' : block.type);
    event.dataTransfer.setData('label', block.label);
    event.dataTransfer.setData('isCorrect', block.isCorrect);
    event.dataTransfer.setData('hint', block.hint);
    event.dataTransfer.effectAllowed = 'move';
  };

  const correct = blockTypes.filter(b => b.isCorrect);
  const traps = blockTypes.filter(b => !b.isCorrect);

  return (
    <div style={{ width: 220, background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Библиотека блоков</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8' }}>Перетащи на холст</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {/* Основные блоки */}
        <p style={{ margin: '0 0 8px 2px', fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Основные</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {correct.map(block => (
            <div
              key={block.type}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              style={{
                borderRadius: 10, overflow: 'visible',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                cursor: 'grab', transition: 'transform 0.15s, box-shadow 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.13)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
            >
              <BlockPreview preview={block.preview} label={block.label} isCorrect={block.isCorrect} />
              <div style={{ padding: '5px 8px 6px', background: 'white', borderRadius: '0 0 10px 10px', borderTop: '1px solid #f1f5f9' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', lineHeight: 1.3 }}>{block.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Блоки-ловушки */}
        <p style={{ margin: '0 0 8px 2px', fontSize: 10, fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ловушки</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {traps.map(block => (
            <div
              key={block.type}
              draggable
              onDragStart={(e) => onDragStart(e, block)}
              style={{
                borderRadius: 10, overflow: 'visible',
                boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
                cursor: 'grab', transition: 'transform 0.15s, box-shadow 0.15s',
                userSelect: 'none',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(239,68,68,0.15)'; }}
            >
              <BlockPreview preview={block.preview} label={block.label} isCorrect={block.isCorrect} />
              <div style={{ padding: '5px 8px 6px', background: '#fff5f5', borderRadius: '0 0 10px 10px', borderTop: '1px solid #fee2e2' }}>
                <p style={{ margin: 0, fontSize: 10, color: '#ef4444', lineHeight: 1.3 }}>{block.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Подсказка */}
        <div style={{ marginTop: 16, padding: '10px 12px', background: '#eff6ff', borderRadius: 10, border: '1px solid #dbeafe' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#3b82f6', lineHeight: 1.5 }}>
            <strong>Совет:</strong> Зажми Shift и кликай блоки для выравнивания нескольких сразу.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
