import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, ReactFlowProvider, addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';
import 'reactflow/dist/style.css';
import StartEndNode from '../editor/nodes/StartEndNode';
import ProcessNode from '../editor/nodes/ProcessNode';
import DecisionNode from '../editor/nodes/DecisionNode';
import WaypointNode from '../editor/nodes/WaypointNode';
import PredefinedProcessNode from '../editor/nodes/PredefinedProcessNode';
import DataNode from '../editor/nodes/DataNode';
import BezierEdge from '../editor/edges/BezierEdge';
import StepEdge from '../editor/edges/StepEdge';

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  waypoint: WaypointNode,
  predefined_process: PredefinedProcessNode,
  data: DataNode,
};

// Выбираем тип стрелок в зависимости от edgeType варианта
const getEdgeTypes = (edgeType) => {
  if (edgeType === 'step') {
    return { custom: StepEdge };
  }
  return { custom: BezierEdge };
};

const StudentView = ({ variant, studentName, groupName, mode, onSubmit, onBack, showTrapHighlighting = true }) => {
  const [placedBlocks, setPlacedBlocks] = useState({});
  const [availableBlocks, setAvailableBlocks] = useState(() => {
    const arr = [...variant.blocks];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [timeLeft, setTimeLeft] = useState(variant.timeLimit || 300);
  const [examStarted, setExamStarted] = useState(mode !== 'exam');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const didFitRef = useRef(false);

  // Тип стрелок из варианта
  const edgeTypes = getEdgeTypes(variant.edgeType);

  // Фитим вью один раз — когда rfInstance и ноды оба готовы
  useEffect(() => {
    if (rfInstance && nodes.length > 0 && !didFitRef.current) {
      didFitRef.current = true;
      rfInstance.fitView({ padding: 0.15, maxZoom: 1, duration: 400 });
    }
  }, [rfInstance, nodes.length]);

  // Сбрасываем флаг при смене варианта
  useEffect(() => {
    didFitRef.current = false;
  }, [variant]);

  // Инициализация схемы — точно как в VariantPreview (который уже работает правильно)
  useEffect(() => {
    const waypointIds = new Set(
      variant.slots.filter(s => s.type === 'waypoint').map(s => s.id)
    );

    const initialNodes = variant.slots.map(slot => {
      if (slot.type === 'waypoint') {
        return {
          id: String(slot.id),
          type: 'waypoint',
          position: { x: slot.x, y: slot.y },
          data: { label: '', disableHandles: true },
        };
      }
      return {
        id: String(slot.id),
        type: slot.type,
        position: { x: slot.x, y: slot.y },
        data: {
          label: placedBlocks[slot.id]?.text || '⬅️ ПЕРЕТАЩИ',
          type: slot.type,
          isCorrect: (!showTrapHighlighting && placedBlocks[slot.id]?.isCorrect === false)
            ? undefined
            : placedBlocks[slot.id]?.isCorrect,
          isEmpty: !placedBlocks[slot.id],
          expectedText: slot.expectedText,
          disableHandles: true,
        },
      };
    });
    setNodes(initialNodes);

    // Рёбра — та же логика что в VariantPreview: fromSide/toSide применяем напрямую
    const initialEdges = variant.arrows.map((arrow, idx) => ({
      id: `edge-${idx}`,
      source: String(arrow.from),
      target: String(arrow.to),
      type: 'custom',
      sourceHandle: arrow.fromSide || 'bottom',
      targetHandle: arrow.toSide || 'top',
      data: {
        label: arrow.label || null,
        toWaypoint: waypointIds.has(arrow.to),
      },
    }));
    setEdges(initialEdges);
  }, [variant, placedBlocks]);

  useEffect(() => {
    let interval;
    if (mode === 'exam' && examStarted && timeLeft > 0 && !submitted) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, examStarted, timeLeft, submitted]);

  const handleAutoSubmit = () => {
    if (!submitted) {
      alert('⏰ Время вышло! Работа автоматически сдаётся.');
      handleSubmit();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onDragStart = (event, block) => {
    setDraggingId(block.id);
    event.dataTransfer.setData('application/reactflow', JSON.stringify(block));
    event.dataTransfer.effectAllowed = 'move';
    // Используем сам элемент как ghost — он уже имеет нужную форму
    const el = event.currentTarget;
    event.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event) => {
    event.preventDefault();
    const blockData = event.dataTransfer.getData('application/reactflow');
    if (!blockData || !rfInstance) return;

    const block = JSON.parse(blockData);
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    // Все пустые слоты (не waypoint) — ищем ближайший по расстоянию к точке дропа
    const emptySlots = variant.slots.filter(slot => !placedBlocks[slot.id] && slot.type !== 'waypoint');

    if (emptySlots.length === 0) {
      alert('❌ Все слоты заполнены');
      return;
    }

    const nearestSlot = emptySlots.reduce((nearest, slot) => {
      const dist = Math.hypot(position.x - slot.x, position.y - slot.y);
      const nearestDist = Math.hypot(position.x - nearest.x, position.y - nearest.y);
      return dist < nearestDist ? slot : nearest;
    });

    setPlacedBlocks(prev => ({ ...prev, [nearestSlot.id]: block }));
    setAvailableBlocks(prev => prev.filter(b => b.id !== block.id));

    setNodes(prev => prev.map(node =>
      node.id === String(nearestSlot.id)
        ? { ...node, data: { ...node.data, label: block.text, isEmpty: false, isCorrect: (!showTrapHighlighting && block.isCorrect === false) ? undefined : block.isCorrect } }
        : node
    ));
  };

  const handleReturnBlock = (slotId) => {
    const block = placedBlocks[slotId];
    if (block) {
      setAvailableBlocks(prev => [...prev, block]);
      setPlacedBlocks(prev => {
        const newState = { ...prev };
        delete newState[slotId];
        return newState;
      });
      
      // Обновляем ноду
      setNodes(prev => prev.map(node => 
        node.id === String(slotId) 
          ? { ...node, data: { ...node.data, label: '⬅️ ПЕРЕТАЩИ', isEmpty: true } }
          : node
      ));
    }
  };

  const handleReset = () => {
    if (mode === 'exam' && examStarted) {
      alert('❌ Во время экзамена сброс запрещён!');
      return;
    }
    setPlacedBlocks({});
    const arr = [...variant.blocks];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setAvailableBlocks(arr);
    setResult(null);
    setShowResult(false);
    setNodes(prev => prev.map(node => ({
      ...node,
      data: { ...node.data, label: '⬅️ ПЕРЕТАЩИ', isEmpty: true, isCorrect: true }
    })));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    const mistakes = [];
    // Waypoint-слоты не участвуют в оценке
    const gradedSlots = variant.slots.filter(s => s.type !== 'waypoint');
    const totalCount = gradedSlots.length;

    for (const slot of gradedSlots) {
      const block = placedBlocks[slot.id];
      if (!block) {
        mistakes.push({ slot, expected: slot.expectedText, got: 'ПУСТО' });
      } else if (block.text !== slot.expectedText) {
        mistakes.push({ slot, expected: slot.expectedText, got: block.text });
      } else if (!block.isCorrect) {
        mistakes.push({ slot, expected: slot.expectedText, got: block.text, isTrap: true });
      } else {
        correctCount++;
      }
    }

    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100;
    const passed = mode === 'exam' ? score >= 70 : true;
    
    const resultData = {
      studentName,
      groupName,
      variantName: variant.name,
      mode,
      score,
      passed,
      mistakes,
      total: totalCount,
      correct: correctCount,
      date: new Date().toLocaleString(),
      placedBlocks: { ...placedBlocks }
    };
    
    setResult(resultData);
    setShowResult(true);
    setSubmitted(true);
    if (onSubmit) onSubmit(resultData);
  };

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  if (!examStarted && mode === 'exam' && !submitted) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 40, maxWidth: 500, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2>Экзамен: {variant.name}</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>{variant.description}</p>
          
          <div style={{ background: '#f1f5f9', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>⏱️ Время на выполнение:</span>
              <strong>{Math.floor(variant.timeLimit / 60)} минут</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>📦 Количество блоков:</span>
              <strong>{variant.slots.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>✅ Проходной балл:</span>
              <strong style={{ color: '#10b981' }}>70%</strong>
            </div>
          </div>
          
          <button onClick={() => setExamStarted(true)} style={{ width: '100%', padding: 14, background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🚀 Начать экзамен</button>
          <button onClick={onBack} style={{ marginTop: 12, padding: 12, background: 'transparent', color: '#666', border: 'none', borderRadius: 12, cursor: 'pointer' }}>← Назад</button>
        </div>
      </div>
    );
  }

  // Модальное окно результата
  const ResultModal = () => {
    if (!showResult || !result) return null;
    const isSuccess = result.score >= 80;

    const successMessages = [
      { emoji: '🎉', title: 'Поздравляем!',         subtitle: 'Отличная работа! Вы прекрасно разбираетесь в блок-схемах.' },
      { emoji: '🏆', title: 'Великолепно!',          subtitle: 'Блестящий результат! Так держать!' },
      { emoji: '🌟', title: 'Превосходно!',          subtitle: 'Вы отлично усвоили материал. Продолжайте в том же духе!' },
      { emoji: '🚀', title: 'Молодец!',              subtitle: 'Высший класс! Вы справились на ура.' },
    ];
    const failMessages = [
      { emoji: '📚', title: 'Не сдавайся!',          subtitle: 'Изучи материал ещё раз и попробуй снова — всё получится!' },
      { emoji: '💪', title: 'Продолжай стараться!',   subtitle: 'Ошибки — это часть обучения. Повтори тему и попробуй ещё раз.' },
      { emoji: '🔍', title: 'Разберись с ошибками!', subtitle: 'Посмотри на ошибки внимательно, изучи материал и попробуй снова.' },
      { emoji: '📖', title: 'Учись дальше!',          subtitle: 'Не расстраивайся! Ещё немного практики — и результат улучшится.' },
    ];
    const messages = isSuccess ? successMessages : failMessages;
    const msg = messages[result.score % messages.length];

    const scoreColor  = isSuccess ? '#059669' : result.score >= 60 ? '#d97706' : '#dc2626';
    const scoreBg     = isSuccess ? 'linear-gradient(135deg, #059669, #10b981)' : result.score >= 60 ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'linear-gradient(135deg, #dc2626, #ef4444)';

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,23,42,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: 'white', borderRadius: 24, width: '100%', maxWidth: 540,
          boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: '90vh',
        }}>
          {/* Цветная шапка */}
          <div style={{ background: scoreBg, padding: '32px 32px 28px', textAlign: 'center', position: 'relative', flexShrink: 0 }}>
            <div style={{ fontSize: 52, marginBottom: 4 }}>{msg.emoji}</div>
            <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>{msg.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: 14 }}>{msg.subtitle}</p>
          </div>

          {/* Счёт */}
          <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
              {/* Большой процент */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{result.score}%</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>итоговый балл</div>
              </div>
              <div style={{ width: 1, height: 60, background: '#f1f5f9' }} />
              {/* Правильно/всего */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{result.correct}<span style={{ fontSize: 20, color: '#94a3b8' }}>/{result.total}</span></div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>правильных блоков</div>
              </div>
              <div style={{ width: 1, height: 60, background: '#f1f5f9' }} />
              {/* Ошибки */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: result.mistakes.length > 0 ? '#dc2626' : '#059669', lineHeight: 1 }}>{result.mistakes.length}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>ошибок</div>
              </div>
            </div>

            {/* Прогресс-бар */}
            <div style={{ marginTop: 20, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${result.score}%`, background: scoreBg, borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
          </div>

          {/* Ошибки (скроллируемые) */}
          {result.mistakes.length > 0 && (
            <div style={{ padding: '16px 32px', overflowY: 'auto', maxHeight: 220, flexShrink: 0 }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ошибки</p>
              {result.mistakes.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', background: '#fff1f2', borderRadius: 10, marginBottom: 6, border: '1px solid #fecdd3' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>✗</span>
                  <div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>
                      Место <strong>{m.slot.id}</strong>: ожидалось <strong>«{m.expected}»</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#dc2626' }}>
                      Ваш ответ: <strong>{m.got}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Кнопки */}
          <div style={{ padding: '16px 32px 24px', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ flex: 1, padding: '12px 0', background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              Пройти заново
            </button>
            <button
              onClick={onBack}
              style={{ flex: 1, padding: '12px 0', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  };

  const modeColor = mode === 'exam' ? '#ef4444' : mode === 'practice' ? '#3b82f6' : '#10b981';
  const modeLabel = mode === 'exam' ? 'Экзамен' : mode === 'practice' ? 'Тренировка' : 'Обучение';

  // Компонент блока с правильной формой
  const BlockShape = ({ block, isDragging }) => {
    const type   = block.type;
    const isTrap = showTrapHighlighting && block.isCorrect === false;

    const inner = (
      <span style={{
        position: 'relative', zIndex: 1,
        color: 'white', fontWeight: 700, fontSize: 12,
        textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word',
        display: 'block',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}>
        {isTrap && <small style={{ display: 'block', fontSize: 9, opacity: 0.85, letterSpacing: '0.05em', marginBottom: 2 }}>⚠ ЛОВУШКА</small>}
        {block.text}
        {showHint && block.hint && (
          <small style={{ display: 'block', fontSize: 10, opacity: 0.75, marginTop: 3, fontWeight: 400 }}>💡 {block.hint}</small>
        )}
      </span>
    );

    if (type === 'start' || type === 'end') {
      const grad = type === 'start'
        ? 'linear-gradient(140deg, #047857, #10b981, #34d399)'
        : 'linear-gradient(140deg, #5b21b6, #8b5cf6, #a78bfa)';
      return (
        <div style={{ width: '100%', height: 58, borderRadius: 29, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.18), transparent)', borderRadius: '29px 29px 0 0', pointerEvents: 'none' }} />
          {inner}
        </div>
      );
    }

    if (type === 'decision') {
      return (
        <div style={{ width: '100%', height: 58, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, #b45309, #f59e0b, #fcd34d)', clipPath: 'polygon(50% 3px, calc(100% - 3px) 50%, 50% calc(100% - 3px), 3px 50%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent 50%)', clipPath: 'polygon(50% 3px, calc(100% - 3px) 50%, 50% calc(100% - 3px), 3px 50%)', pointerEvents: 'none' }} />
          {inner}
        </div>
      );
    }

    if (type === 'predefined_process') {
      const grad = isTrap
        ? 'linear-gradient(140deg, #991b1b, #ef4444, #f87171)'
        : 'linear-gradient(140deg, #0e7490, #0891b2, #38bdf8)';
      return (
        <div style={{ width: '100%', height: 58, borderRadius: 4, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)', borderRadius: '4px 4px 0 0', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.4)' }} />
          <div style={{ position: 'absolute', right: 10, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.4)' }} />
          {inner}
        </div>
      );
    }

    if (type === 'data') {
      const grad = isTrap
        ? 'linear-gradient(140deg, #991b1b, #ef4444, #f87171)'
        : 'linear-gradient(140deg, #4338ca, #6366f1, #818cf8)';
      return (
        <div style={{ width: '100%', height: 58, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: grad, clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent 50%)', clipPath: 'polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)', pointerEvents: 'none' }} />
          {inner}
        </div>
      );
    }

    // process / trap
    const grad = isTrap
      ? 'linear-gradient(140deg, #991b1b, #ef4444, #f87171)'
      : 'linear-gradient(140deg, #1e40af, #3b82f6, #60a5fa)';
    return (
      <div style={{ width: '100%', height: 58, borderRadius: 10, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.14), transparent)', borderRadius: '10px 10px 0 0', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, background: 'rgba(255,255,255,0.3)', borderRadius: '0 3px 3px 0' }} />
        {inner}
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Шапка */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
          >
            ← Назад
          </button>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <span style={{ padding: '3px 10px', borderRadius: 20, background: modeColor + '18', color: modeColor, fontSize: 12, fontWeight: 600 }}>{modeLabel}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>{variant.name}</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{studentName} · {groupName}</span>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {mode === 'exam' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
              background: timeLeft < 60 ? '#fef2f2' : '#f8fafc',
              border: `1px solid ${timeLeft < 60 ? '#fca5a5' : '#e2e8f0'}`,
              borderRadius: 10, fontWeight: 700, fontSize: 15,
              color: timeLeft < 60 ? '#dc2626' : '#1e293b'
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          <button
            onClick={() => setShowHint(!showHint)}
            style={{ padding: '7px 14px', background: showHint ? '#fef3c7' : '#f8fafc', border: `1px solid ${showHint ? '#fcd34d' : '#e2e8f0'}`, borderRadius: 10, cursor: 'pointer', fontSize: 13, color: showHint ? '#92400e' : '#64748b', fontWeight: 500 }}
          >
            💡 {showHint ? 'Скрыть подсказки' : 'Подсказки'}
          </button>
          {mode !== 'exam' && (
            <button onClick={handleReset} style={{ padding: '7px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
              Сбросить
            </button>
          )}
          <button
            onClick={handleSubmit}
            style={{ padding: '7px 18px', background: modeColor, color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Сдать работу
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Боковая панель блоков */}
        <div style={{ width: 260, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Блоки · <span style={{ color: modeColor }}>{availableBlocks.length}</span> осталось
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>Перетащи блок на нужное место схемы</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 6px' }}>
            {availableBlocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>Все блоки размещены</p>
                <p style={{ fontSize: 11, marginTop: 4 }}>Проверь схему и сдавай!</p>
              </div>
            ) : (
              availableBlocks.map((block) => {
                const isDragging = draggingId === block.id;
                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, block)}
                    onDragEnd={() => setDraggingId(null)}
                    style={{
                      marginBottom: 8,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      userSelect: 'none',
                      opacity: isDragging ? 0.35 : 1,
                      transform: isDragging ? 'scale(0.96)' : 'scale(1)',
                      transition: 'opacity 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease',
                      borderRadius: block.type === 'start' || block.type === 'end' ? 29 : block.type === 'decision' || block.type === 'data' ? 0 : 10,
                      boxShadow: isDragging
                        ? 'none'
                        : '0 3px 10px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)',
                    }}
                    onMouseEnter={e => {
                      if (!isDragging) {
                        e.currentTarget.style.transform = 'scale(1.03) translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)';
                    }}
                  >
                    <BlockShape block={block} isDragging={isDragging} />
                  </div>
                );
              })
            )}
          </div>

          {/* Возврат блоков */}
          {Object.keys(placedBlocks).length > 0 && (
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '8px 10px' }}>
              <p style={{ margin: '0 0 5px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Убрать со схемы:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(placedBlocks).map(([slotId, block]) => (
                  <button
                    key={slotId}
                    onClick={() => handleReturnBlock(Number(slotId))}
                    style={{ padding: '5px 8px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 11, color: '#dc2626', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
                  >
                    ↩ {block.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Схема */}
        <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
            minZoom={0.1}
            maxZoom={2}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={true}
            zoomOnScroll={true}
          >
            <Background variant="dots" gap={20} size={1} color="#e2e8f0" />
            <Controls showInteractive={false} />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      <ResultModal />
    </div>
  );
};

export default StudentView;