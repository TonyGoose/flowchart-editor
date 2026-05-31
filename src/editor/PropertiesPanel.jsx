import React from 'react';

const PropertiesPanel = ({
  selectedNode,
  selectedEdge,
  onUpdateNodeLabel,
  onUpdateNodeHint,
  onUpdateNodeIsCorrect,
  onUpdateNodePosition,
  onMoveNode,
  onUpdateEdgeLabel,
  onUpdateEdgeSourceHandle,
  onUpdateEdgeTargetHandle,
  onDeleteNode,
  onDeleteEdge,
  onAlignNodes,
  onUpdateEdgePoints,
  sides,
}) => {
  if (!selectedNode && !selectedEdge) {
    return (
      <div
        style={{
          width: '340px',
          background: '#1e1e2e',
          borderLeft: '1px solid #313244',
          padding: '20px',
          overflowY: 'auto',
          color: '#cdd6f4',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🎨</div>
          <h3 style={{ marginBottom: 8, color: '#f9e2af' }}>Панель свойств</h3>
          <p style={{ fontSize: 13, color: '#6c7086' }}>
            Выделите блок или стрелку для редактирования
          </p>
        </div>

        <div style={{ background: '#313244', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <h4 style={{ marginBottom: 12, fontSize: 14, color: '#f9e2af' }}>📏 Выравнивание блоков</h4>
          <p style={{ fontSize: 11, color: '#6c7086', marginBottom: 12 }}>
            Зажми Shift + клик на блоки для выделения нескольких
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <button
              onClick={() => onAlignNodes('left')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⬅️ По левому
            </button>
            <button
              onClick={() => onAlignNodes('center-h')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⬌ По центру X
            </button>
            <button
              onClick={() => onAlignNodes('right')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ➡️ По правому
            </button>
            <button
              onClick={() => onAlignNodes('top')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⬆️ По верху
            </button>
            <button
              onClick={() => onAlignNodes('center-v')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⬍ По центру Y
            </button>
            <button
              onClick={() => onAlignNodes('bottom')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⬇️ По низу
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            <button
              onClick={() => onAlignNodes('distribute-h')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              📊 Распределить X
            </button>
            <button
              onClick={() => onAlignNodes('distribute-v')}
              style={{
                padding: '8px',
                background: '#45475a',
                border: 'none',
                borderRadius: 8,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              📈 Распределить Y
            </button>
          </div>
        </div>

        <div style={{ background: '#313244', borderRadius: 12, padding: 16 }}>
          <h4 style={{ marginBottom: 12, fontSize: 14, color: '#f9e2af' }}>⌨️ Горячие клавиши</h4>
          <div style={{ fontSize: 12, color: '#6c7086' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>🗑️ Delete</span>
              <span>Удалить выделенное</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>📋 Ctrl+C</span>
              <span>Копировать блок</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>📎 Ctrl+V</span>
              <span>Вставить блок</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>🎯 Ctrl+A</span>
              <span>Выделить всё</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🔍 Shift + клик</span>
              <span>Выделить несколько</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedNode) {
    const isTrap = selectedNode.data.isCorrect === false;
    const nodeWidth = selectedNode.width || 150;
    const nodeHeight = selectedNode.height || 70;

    return (
      <div
        style={{
          width: '340px',
          background: '#1e1e2e',
          borderLeft: '1px solid #313244',
          padding: '20px',
          overflowY: 'auto',
          color: '#cdd6f4',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3 style={{ color: '#f9e2af' }}>📝 Свойства блока</h3>
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            style={{
              background: '#f38ba8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#1e1e2e',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🗑️ Удалить
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#a6adc8',
            }}
          >
            📝 Текст:
          </label>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => onUpdateNodeLabel(selectedNode.id, e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '1px solid #313244',
              background: '#313244',
              color: '#cdd6f4',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#a6adc8',
            }}
          >
            💡 Подсказка:
          </label>
          <input
            type="text"
            value={selectedNode.data.hint || ''}
            onChange={(e) => onUpdateNodeHint(selectedNode.id, e.target.value)}
            placeholder="Подсказка для студентов"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '1px solid #313244',
              background: '#313244',
              color: '#cdd6f4',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ background: '#313244', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h4 style={{ marginBottom: 12, fontSize: 13, color: '#f9e2af' }}>📍 Координаты блока</h4>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: 'block', marginBottom: 4, fontSize: 11, color: '#a6adc8' }}
            >
              X (горизонталь)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onMoveNode(-1, 0)}
                style={{
                  padding: '8px 12px',
                  background: '#45475a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cdd6f4',
                  cursor: 'pointer',
                  minWidth: '50px',
                }}
              >
                -1
              </button>
              <input
                type="number"
                value={Math.round(selectedNode.position.x)}
                onChange={(e) =>
                  onUpdateNodePosition(selectedNode.id, parseInt(e.target.value), selectedNode.position.y)
                }
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '1px solid #45475a',
                  background: '#45475a',
                  color: '#cdd6f4',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => onMoveNode(1, 0)}
                style={{
                  padding: '8px 12px',
                  background: '#45475a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cdd6f4',
                  cursor: 'pointer',
                  minWidth: '50px',
                }}
              >
                +1
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{ display: 'block', marginBottom: 4, fontSize: 11, color: '#a6adc8' }}
            >
              Y (вертикаль)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => onMoveNode(0, -1)}
                style={{
                  padding: '8px 12px',
                  background: '#45475a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cdd6f4',
                  cursor: 'pointer',
                  minWidth: '50px',
                }}
              >
                -1
              </button>
              <input
                type="number"
                value={Math.round(selectedNode.position.y)}
                onChange={(e) =>
                  onUpdateNodePosition(selectedNode.id, selectedNode.position.x, parseInt(e.target.value))
                }
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 8,
                  border: '1px solid #45475a',
                  background: '#45475a',
                  color: '#cdd6f4',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              />
              <button
                onClick={() => onMoveNode(0, 1)}
                style={{
                  padding: '8px 12px',
                  background: '#45475a',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cdd6f4',
                  cursor: 'pointer',
                  minWidth: '50px',
                }}
              >
                +1
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <button
              onClick={() => onMoveNode(-10, 0)}
              style={{
                padding: '6px 10px',
                background: '#45475a',
                border: 'none',
                borderRadius: 6,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ← 10px
            </button>
            <button
              onClick={() => onMoveNode(10, 0)}
              style={{
                padding: '6px 10px',
                background: '#45475a',
                border: 'none',
                borderRadius: 6,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              10px →
            </button>
            <button
              onClick={() => onMoveNode(0, -10)}
              style={{
                padding: '6px 10px',
                background: '#45475a',
                border: 'none',
                borderRadius: 6,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ↑ 10px
            </button>
            <button
              onClick={() => onMoveNode(0, 10)}
              style={{
                padding: '6px 10px',
                background: '#45475a',
                border: 'none',
                borderRadius: 6,
                color: '#cdd6f4',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              10px ↓
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: '#6c7086', textAlign: 'center' }}>
            📐 Размер: {nodeWidth} × {nodeHeight} px
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!isTrap}
              onChange={(e) => onUpdateNodeIsCorrect(selectedNode.id, e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#a6adc8' }}>✅ Правильный блок</span>
          </label>
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div
        style={{
          width: '340px',
          background: '#1e1e2e',
          borderLeft: '1px solid #313244',
          padding: '20px',
          overflowY: 'auto',
          color: '#cdd6f4',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3 style={{ color: '#f9e2af' }}>🔗 Свойства стрелки</h3>
          <button
            onClick={() => onDeleteEdge(selectedEdge.id)}
            style={{
              background: '#f38ba8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              color: '#1e1e2e',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            🗑️ Удалить
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 12,
              fontWeight: 'bold',
              color: '#a6adc8',
            }}
          >
            🏷️ Подпись:
          </label>
          <input
            type="text"
            value={selectedEdge.label || ''}
            onChange={(e) => onUpdateEdgeLabel(selectedEdge.id, e.target.value)}
            placeholder="да / нет"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: '1px solid #313244',
              background: '#313244',
              color: '#cdd6f4',
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => onUpdateEdgeLabel(selectedEdge.id, 'да')}
            style={{
              flex: 1,
              padding: 8,
              background: '#a6e3a1',
              border: 'none',
              borderRadius: 8,
              color: '#1e1e2e',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ✅ да
          </button>
          <button
            onClick={() => onUpdateEdgeLabel(selectedEdge.id, 'нет')}
            style={{
              flex: 1,
              padding: 8,
              background: '#f38ba8',
              border: 'none',
              borderRadius: 8,
              color: '#1e1e2e',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ❌ нет
          </button>
          <button
            onClick={() => onUpdateEdgeLabel(selectedEdge.id, '')}
            style={{
              padding: '8px 12px',
              background: '#45475a',
              border: 'none',
              borderRadius: 8,
              color: '#cdd6f4',
              cursor: 'pointer',
            }}
          >
            Очистить
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 'bold', color: '#a6adc8' }}
          >
            📤 Откуда выходит:
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {sides.map((side) => (
              <button
                key={side.value}
                onClick={() => onUpdateEdgeSourceHandle(selectedEdge.id, side.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedEdge.sourceHandle === side.value ? '#89b4fa' : '#313244',
                  color: selectedEdge.sourceHandle === side.value ? '#1e1e2e' : '#cdd6f4',
                  fontSize: 16,
                }}
              >
                {side.icon}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 'bold', color: '#a6adc8' }}
          >
            📥 Куда входит:
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {sides.map((side) => (
              <button
                key={side.value}
                onClick={() => onUpdateEdgeTargetHandle(selectedEdge.id, side.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedEdge.targetHandle === side.value ? '#89b4fa' : '#313244',
                  color: selectedEdge.targetHandle === side.value ? '#1e1e2e' : '#cdd6f4',
                  fontSize: 16,
                }}
              >
                {side.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Управление точками изгиба */}
        <div style={{ marginTop: 16, padding: 12, background: '#313244', borderRadius: 8 }}>
          <h4 style={{ marginBottom: 8, fontSize: 12, color: '#f9e2af' }}>📐 Точки изгиба</h4>
          <p style={{ fontSize: 10, color: '#a6adc8', marginBottom: 8 }}>
            {selectedEdge.data?.points?.length || 0} точек изгиба
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                const newPoints = [
                  ...(selectedEdge.data?.points || []),
                  { x: 0, y: 0 },
                ];
                onUpdateEdgePoints(selectedEdge.id, newPoints);
              }}
              style={{
                flex: 1,
                padding: 6,
                background: '#3b82f6',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              ➕ Добавить точку
            </button>
            <button
              onClick={() => onUpdateEdgePoints(selectedEdge.id, [])}
              style={{
                flex: 1,
                padding: 6,
                background: '#ef4444',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              🗑️ Очистить все
            </button>
          </div>
          <p style={{ fontSize: 9, color: '#6c7086', marginTop: 8 }}>
            💡 Кликни на оранжевую точку на стрелке и перетащи | Двойной клик для удаления
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PropertiesPanel;