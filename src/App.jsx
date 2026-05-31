import React, { useState, useEffect, useRef } from 'react';
import { ReactFlowProvider, MiniMap, useReactFlow } from 'reactflow';
import ReactFlow, { Background, Controls } from 'reactflow';
import StudentView from './student/StudentView';
import Editor from './editor/Editor';
import { VARIANTS, loadVariants, saveVariants, loadResults, saveResults } from './data/variants';
import StartEndNode from './editor/nodes/StartEndNode';
import ProcessNode from './editor/nodes/ProcessNode';
import DecisionNode from './editor/nodes/DecisionNode';
import PredefinedProcessNode from './editor/nodes/PredefinedProcessNode';
import DataNode from './editor/nodes/DataNode';
import BezierEdge from './editor/edges/BezierEdge';
import StepEdge from './editor/edges/StepEdge';
import 'reactflow/dist/style.css';

const previewNodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  predefined_process: PredefinedProcessNode,
  data: DataNode,
};

function VariantPreviewInner({ variant }) {
  const { fitView } = useReactFlow();
  const edgeTypes = variant.edgeType === 'step'
    ? { custom: StepEdge }
    : { custom: BezierEdge };

  const nodes = variant.slots.map(slot => ({
    id: String(slot.id),
    type: slot.type,
    position: { x: slot.x, y: slot.y },
    data: { label: slot.expectedText, type: slot.type, disableHandles: true },
  }));

  const edges = (variant.arrows || []).map((arrow, idx) => ({
    id: `edge-${idx}`,
    source: String(arrow.from),
    target: String(arrow.to),
    type: 'custom',
    sourceHandle: arrow.fromSide || 'bottom',
    targetHandle: arrow.toSide || 'top',
    data: { label: arrow.label || null },
  }));

  // Фитим вью после монтирования, когда ноды уже есть
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.15, maxZoom: 1, duration: 300 });
    }, 50);
    return () => clearTimeout(timer);
  }, [variant.id]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={previewNodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
      minZoom={0.05}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={true}
      zoomOnScroll={true}
    >
      <Background variant="dots" gap={20} size={1} />
      <Controls showInteractive={false} />
      <MiniMap nodeColor={node => {
        if (node.type === 'start') return '#10b981';
        if (node.type === 'end') return '#8b5cf6';
        if (node.type === 'decision') return '#f59e0b';
        if (node.type === 'predefined_process') return '#0891b2';
        if (node.type === 'data') return '#6366f1';
        return '#3b82f6';
      }} />
    </ReactFlow>
  );
}

function VariantPreview({ variant }) {
  return (
    <ReactFlowProvider>
      <VariantPreviewInner variant={variant} />
    </ReactFlowProvider>
  );
}

function App() {
  const [mode, setMode] = useState('menu');
  const [variants, setVariants] = useState({});
  const [results, setResults] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [studentInfo, setStudentInfo] = useState({ name: '', group: '' });
  const [learningMode, setLearningMode] = useState('practice');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [selectedPreviewVariant, setSelectedPreviewVariant] = useState(null);
  const [adminTab, setAdminTab] = useState('variants');
  const [examCategory, setExamCategory] = useState(null);

  useEffect(() => {
    const loaded = loadVariants();
    setVariants(loaded);
    setResults(loadResults());
  }, []);

  const handleSaveResults = (result) => {
    const newResults = [...results, result];
    setResults(newResults);
    saveResults(newResults);
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminLoggedIn(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const handleSaveVariant = (updatedVariant) => {
    const newVariants = { ...variants, [updatedVariant.id]: updatedVariant };
    setVariants(newVariants);
    saveVariants(newVariants);
    setIsEditing(false);
    setEditingVariant(null);
    // Обновляем все состояния, которые могут держать старый объект варианта
    if (selectedPreviewVariant?.id === updatedVariant.id) {
      setSelectedPreviewVariant(updatedVariant);
    }
    if (selectedVariant?.id === updatedVariant.id) {
      setSelectedVariant(updatedVariant);
    }
    alert(`Вариант "${updatedVariant.name}" сохранён!`);
  };

  const handleDeleteVariant = (id) => {
    if (window.confirm('Удалить этот вариант?')) {
      const newVariants = { ...variants };
      delete newVariants[id];
      setVariants(newVariants);
      saveVariants(newVariants);
    }
  };

  const handleCreateVariant = () => {
    const newId = Math.max(...Object.keys(variants).map(Number), 0) + 1;
    const newVariant = {
      id: newId,
      name: `Новый вариант ${newId}`,
      category: 'custom',
      difficulty: 'medium',
      timeLimit: 300,
      description: 'Описание варианта',
      topics: ['Новый'],
      blocks: [],
      slots: [],
      arrows: [],
    };
    setEditingVariant(newVariant);
    setIsEditing(true);
  };

  const categories = [
    { id: 'all',       name: 'Все',              icon: '📚' },
    { id: 'linear',    name: 'Линейные',         icon: '📏' },
    { id: 'branching', name: 'Ветвления',        icon: '🔀' },
    { id: 'loop',      name: 'Циклы',            icon: '🔄' },
    { id: 'array',     name: 'Массивы',          icon: '📊' },
    { id: 'sorting',   name: 'Сортировка',       icon: '⚡' },
    { id: 'search',    name: 'Поиск',            icon: '🔍' },
    { id: 'math',      name: 'Математика',       icon: '🧮' },
    { id: 'numerical', name: 'Числ. методы',     icon: '📐' },
    { id: 'recursion', name: 'Рекурсия',         icon: '♾️' },
    { id: 'procedure', name: 'Подпрограммы',     icon: '📋' },
    { id: 'custom',    name: 'Пользовательские', icon: '✨' },
  ];

  const filteredVariants = Object.values(variants).filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ========== АДМИН-ПАНЕЛЬ ==========
  if (mode === 'admin') {
    // --- Логин ---
    if (!isAdminLoggedIn) {
      return (
        <div style={{ height: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)' }}>
          <div style={{ margin: 'auto', width: 380 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🔐</div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>Панель управления</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>Введите пароль для входа</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28 }}>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Пароль"
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
              />
              <button
                onClick={handleAdminLogin}
                style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 15, marginBottom: 10 }}
              >
                Войти
              </button>
              <button
                onClick={() => setMode('menu')}
                style={{ width: '100%', padding: 12, background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer', fontSize: 14 }}
              >
                ← Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    // --- Редактор варианта ---
    if (isEditing) {
      return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 52, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}
              >
                ← Назад
              </button>
              <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Редактор</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>/</span>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{editingVariant?.name}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Перетаскивай блоки · соединяй кружками · Shift для мультивыбора</span>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              key={editingVariant?.id}
              initialVariant={editingVariant}
              onSave={handleSaveVariant}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </div>
      );
    }

    // --- Главная страница админки ---
    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null;
    const passCount = results.filter(r => r.passed).length;
    const failCount = results.length - passCount;
    const catColors = { linear: '#3b82f6', branching: '#f59e0b', loop: '#10b981', array: '#8b5cf6', sorting: '#ef4444', search: '#06b6d4', numerical: '#6366f1', math: '#f97316', recursion: '#ec4899', procedure: '#0891b2', custom: '#64748b' };

    const Tab = ({ id, label, count }) => {
      const active = adminTab === id;
      return (
        <button
          onClick={() => setAdminTab(id)}
          style={{
            padding: '0 20px', height: '100%', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'transparent',
            color: active ? 'white' : 'rgba(255,255,255,0.4)',
            borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          {label}
          <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 11, background: active ? 'rgba(129,140,248,0.25)' : 'rgba(255,255,255,0.07)', color: active ? '#a5b4fc' : 'rgba(255,255,255,0.3)' }}>
            {count}
          </span>
        </button>
      );
    };

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>

        {/* Топбар */}
        <div style={{ background: '#1e293b', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚙️</div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>Панель управления</span>
            </div>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', height: '100%' }}>
              <Tab id="variants" label="Варианты" count={Object.keys(variants).length} />
              <Tab id="results"  label="Результаты" count={results.length} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {adminTab === 'variants' && (
              <button onClick={handleCreateVariant} style={{ padding: '7px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                + Новый вариант
              </button>
            )}
            <button onClick={() => { setIsAdminLoggedIn(false); setMode('menu'); }} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, cursor: 'pointer', fontSize: 13 }}>
              Выйти
            </button>
          </div>
        </div>

        {/* ТАБ: ВАРИАНТЫ */}
        {adminTab === 'variants' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

            {/* Левая панель — список */}
            <div style={{ width: 300, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 12px 8px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Поиск вариантов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ padding: '0 12px 8px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                    style={{ padding: '3px 8px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: selectedCategory === cat.id ? '#1e293b' : '#f1f5f9', color: selectedCategory === cat.id ? 'white' : '#64748b' }}
                  >{cat.icon} {cat.name}</button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {filteredVariants.length === 0 && <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8', fontSize: 13 }}>Ничего не найдено</div>}
                {filteredVariants.map(v => {
                  const isSelected = selectedPreviewVariant?.id === v.id;
                  const cc = catColors[v.category] || '#64748b';
                  const diffColor = v.difficulty === 'easy' ? '#10b981' : v.difficulty === 'medium' ? '#f59e0b' : '#ef4444';
                  const diffLabel = v.difficulty === 'easy' ? 'Лёгкий' : v.difficulty === 'medium' ? 'Средний' : 'Сложный';
                  return (
                    <div key={v.id} onClick={() => setSelectedPreviewVariant(isSelected ? null : v)}
                      style={{ marginBottom: 6, borderRadius: 11, border: isSelected ? `2px solid ${cc}` : '1.5px solid #f1f5f9', background: isSelected ? cc + '0d' : 'white', cursor: 'pointer', overflow: 'hidden', transition: 'all 0.15s' }}
                    >
                      <div style={{ height: 3, background: cc }} />
                      <div style={{ padding: '9px 11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{v.name}</span>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: diffColor + '18', color: diffColor, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{diffLabel}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 7 }}>{v.slots?.length} блоков · {Math.floor((v.timeLimit || 300) / 60)} мин</div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={(e) => { e.stopPropagation(); setEditingVariant(v); setIsEditing(true); }}
                            style={{ flex: 1, padding: '5px 0', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 11, color: '#475569', fontWeight: 500 }}>
                            Редактировать
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteVariant(v.id); }}
                            style={{ padding: '5px 9px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#e11d48' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Центр — предпросмотр */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selectedPreviewVariant ? (
                <>
                  <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[selectedPreviewVariant.category] || '#64748b' }} />
                      <span style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>{selectedPreviewVariant.name}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>· {selectedPreviewVariant.description}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '4px 10px', borderRadius: 8 }}>{selectedPreviewVariant.slots?.length} блоков</span>
                      <button onClick={() => { setEditingVariant(selectedPreviewVariant); setIsEditing(true); }}
                        style={{ padding: '7px 16px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Редактировать
                      </button>
                      <button onClick={() => setSelectedPreviewVariant(null)}
                        style={{ padding: '7px 10px', background: '#f1f5f9', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <VariantPreview key={selectedPreviewVariant.id} variant={selectedPreviewVariant} />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🗂️</div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: '0 0 4px' }}>Выберите вариант слева</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Нажмите на карточку, чтобы увидеть блок-схему</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ТАБ: РЕЗУЛЬТАТЫ */}
        {adminTab === 'results' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 24, gap: 20 }}>

            {/* Статистика */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flexShrink: 0 }}>
              {[
                { label: 'Всего попыток', value: results.length, color: '#1e293b', bg: 'white', sub: 'студентов прошли задания' },
                { label: 'Сдали', value: passCount, color: '#059669', bg: '#f0fdf4', sub: results.length ? Math.round(passCount / results.length * 100) + '% от всех' : '—' },
                { label: 'Не сдали', value: failCount, color: '#dc2626', bg: '#fff1f2', sub: results.length ? Math.round(failCount / results.length * 100) + '% от всех' : '—' },
                { label: 'Средний балл', value: avgScore !== null ? avgScore + '%' : '—', color: '#2563eb', bg: '#eff6ff', sub: 'по всем попыткам' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Таблица результатов */}
            <div style={{ flex: 1, background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>История попыток</span>
                {results.length > 0 && (
                  <button
                    onClick={() => { if (window.confirm('Очистить все результаты?')) { setResults([]); saveResults([]); } }}
                    style={{ padding: '5px 12px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#e11d48' }}
                  >
                    Очистить все
                  </button>
                )}
              </div>

              {results.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#94a3b8' }}>
                  <div style={{ fontSize: 40 }}>📭</div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#64748b', margin: 0 }}>Результатов пока нет</p>
                  <p style={{ fontSize: 13, margin: 0 }}>Они появятся после первого прохождения задания студентом</p>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {/* Заголовок таблицы */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 80px 80px 90px', gap: 0, padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['Студент', 'Группа', 'Вариант', 'Балл', 'Статус', 'Дата'].map(h => (
                      <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                    ))}
                  </div>
                  {/* Строки */}
                  {results.slice().reverse().map((r, i) => {
                    const scoreColor = r.score >= 80 ? '#059669' : r.score >= 60 ? '#d97706' : '#dc2626';
                    const scoreBg   = r.score >= 80 ? '#f0fdf4' : r.score >= 60 ? '#fefce8' : '#fff1f2';
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 80px 80px 90px', gap: 0, padding: '12px 20px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{r.studentName}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{r.groupName}</span>
                        <span style={{ fontSize: 12, color: '#475569' }}>{r.variantName}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor, background: scoreBg, padding: '2px 8px', borderRadius: 8, textAlign: 'center', display: 'inline-block' }}>{r.score}%</span>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: r.passed ? '#f0fdf4' : '#fff1f2', color: r.passed ? '#059669' : '#dc2626', fontWeight: 600, textAlign: 'center' }}>
                          {r.passed ? 'Сдал' : 'Не сдал'}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.date}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== СТУДЕНТ ==========
  if (mode === 'student' && selectedVariant) {
    return (
      <ReactFlowProvider>
        <StudentView
          variant={selectedVariant}
          studentName={studentInfo.name}
          groupName={studentInfo.group}
          mode={learningMode}
          onSubmit={handleSaveResults}
          onBack={() => setMode('variantSelect')}
        />
      </ReactFlowProvider>
    );
  }

  // ========== ВЫБОР ВАРИАНТА ==========
  if (mode === 'variantSelect') {
    const modeConfig = {
      learn:    { gradient: 'linear-gradient(135deg, #10b981, #059669)', icon: '📖', label: 'Обучение',   desc: 'Подсказки включены, времени нет' },
      practice: { gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', icon: '✏️', label: 'Тренировка', desc: 'Без подсказок, без таймера' },
      exam:     { gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '🎓', label: 'Экзамен',    desc: 'Таймер включён, проходной балл 70%' },
    }[learningMode];

    const categoryColors = {
      linear: '#3b82f6', branching: '#f59e0b', loop: '#10b981',
      array: '#8b5cf6', sorting: '#ef4444', search: '#06b6d4',
      numerical: '#6366f1', math: '#f97316', recursion: '#ec4899', procedure: '#0891b2', custom: '#64748b', all: '#1f2937'
    };

    const isExam = learningMode === 'exam';

    const handleSelectVariant = (v) => {
      if (!isExam) setStudentInfo({ name: 'Студент', group: '—' });
      setSelectedVariant(v);
      setMode('student');
    };

    const handleStartExam = () => {
      const pool = examCategory === 'all' || !examCategory
        ? Object.values(variants)
        : Object.values(variants).filter(v => v.category === examCategory);
      if (pool.length === 0) { alert('Нет вариантов по выбранной теме'); return; }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setSelectedVariant(random);
      setMode('student');
    };

    const examReady = isExam && studentInfo.name.trim() && studentInfo.group.trim() && examCategory;

    // ===== ЭКЗАМЕН =====
    if (isExam) {
      const examSubjects = categories.filter(cat => {
        if (cat.id === 'all') return true;
        return Object.values(variants).some(v => v.category === cat.id);
      });

      const subjectColors = {
        all: '#1e293b', linear: '#3b82f6', branching: '#f59e0b', loop: '#10b981',
        array: '#8b5cf6', sorting: '#ef4444', search: '#06b6d4',
        numerical: '#6366f1', math: '#f97316', recursion: '#ec4899', procedure: '#0891b2', custom: '#64748b',
      };

      const subjectGradients = {
        all:       'linear-gradient(135deg, #1e293b, #334155)',
        linear:    'linear-gradient(135deg, #1d4ed8, #3b82f6)',
        branching: 'linear-gradient(135deg, #b45309, #f59e0b)',
        loop:      'linear-gradient(135deg, #047857, #10b981)',
        array:     'linear-gradient(135deg, #5b21b6, #8b5cf6)',
        sorting:   'linear-gradient(135deg, #991b1b, #ef4444)',
        search:    'linear-gradient(135deg, #0e7490, #06b6d4)',
        numerical: 'linear-gradient(135deg, #3730a3, #6366f1)',
        math:      'linear-gradient(135deg, #c2410c, #f97316)',
        recursion: 'linear-gradient(135deg, #9d174d, #ec4899)',
        procedure: 'linear-gradient(135deg, #0e7490, #0891b2)',
        custom:    'linear-gradient(135deg, #374151, #64748b)',
      };

      return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <button onClick={() => setMode('menu')} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '7px 16px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>
            ← Назад
          </button>

          <div style={{ width: '100%', maxWidth: 760 }}>
            {/* Заголовок */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎓</div>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Экзамен</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, margin: 0 }}>Заполните данные, выберите тему — вариант выдастся автоматически</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Данные студента */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24 }}>
                <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Данные студента</p>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>ФИО</label>
                  <input
                    type="text"
                    placeholder="Иванов Иван Иванович"
                    value={studentInfo.name}
                    onChange={(e) => setStudentInfo({ ...studentInfo, name: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Группа</label>
                  <input
                    type="text"
                    placeholder="ИС-21"
                    value={studentInfo.group}
                    onChange={(e) => setStudentInfo({ ...studentInfo, group: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Статус заполнения */}
                <div style={{ padding: '12px 14px', borderRadius: 10, background: studentInfo.name && studentInfo.group ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${studentInfo.name && studentInfo.group ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>{studentInfo.name && studentInfo.group ? '✅' : '⭕'}</span>
                    <span style={{ color: studentInfo.name && studentInfo.group ? '#34d399' : 'rgba(255,255,255,0.35)' }}>
                      {studentInfo.name && studentInfo.group ? 'Данные заполнены' : 'Заполните ФИО и группу'}
                    </span>
                  </div>
                </div>

                {/* Условия экзамена */}
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '⏱', text: 'Ограничение по времени' },
                    { icon: '🎲', text: 'Вариант выдаётся случайно' },
                    { icon: '🚫', text: 'Без подсказок' },
                    { icon: '✅', text: 'Проходной балл: 70%' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Выбор темы */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <p style={{ margin: '0 0 16px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Тема задания</p>

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
                  {examSubjects.map(cat => {
                    const count = cat.id === 'all'
                      ? Object.keys(variants).length
                      : Object.values(variants).filter(v => v.category === cat.id).length;
                    const isSelected = examCategory === cat.id;
                    const grad = subjectGradients[cat.id] || subjectGradients.custom;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setExamCategory(cat.id)}
                        style={{
                          borderRadius: 12, padding: '14px 14px', cursor: 'pointer',
                          background: isSelected ? grad : 'rgba(255,255,255,0.04)',
                          border: isSelected ? '2px solid rgba(255,255,255,0.3)' : '1.5px solid rgba(255,255,255,0.08)',
                          transition: 'all 0.15s',
                          boxShadow: isSelected ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      >
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{cat.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{cat.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{count} {count === 1 ? 'вариант' : count < 5 ? 'варианта' : 'вариантов'}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Кнопка старт */}
                <button
                  onClick={handleStartExam}
                  disabled={!examReady}
                  style={{
                    width: '100%', padding: '14px 0',
                    background: examReady ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'rgba(255,255,255,0.08)',
                    color: examReady ? 'white' : 'rgba(255,255,255,0.25)',
                    border: 'none', borderRadius: 12, cursor: examReady ? 'pointer' : 'not-allowed',
                    fontWeight: 700, fontSize: 15,
                    boxShadow: examReady ? '0 4px 16px rgba(239,68,68,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {examReady ? '🚀 Начать экзамен' : 'Заполните данные и выберите тему'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ===== ОБУЧЕНИЕ / ТРЕНИРОВКА =====
    return (
      <div style={{ height: '100vh', display: 'flex', background: '#f1f5f9' }}>
        {/* Левая панель */}
        <div style={{ width: 280, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: modeConfig.gradient, padding: '24px 22px 20px' }}>
            <button onClick={() => setMode('menu')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 20, padding: '6px 14px', color: 'white', cursor: 'pointer', fontSize: 13, marginBottom: 18 }}>
              ← Назад
            </button>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{modeConfig.icon}</div>
            <h2 style={{ color: 'white', margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{modeConfig.label}</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>{modeConfig.desc}</p>
          </div>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 16 }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Без авторизации</p>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>Данные не требуются — просто выберите задание.</p>
            </div>
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 12 }}>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>Доступно вариантов</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#1e293b', margin: 0 }}>{filteredVariants.length}</p>
            </div>
          </div>
        </div>

        {/* Правая область */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 24px' }}>
            <input type="text" placeholder="Поиск варианта..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, background: selectedCategory === cat.id ? categoryColors[cat.id] : '#f1f5f9', color: selectedCategory === cat.id ? 'white' : '#475569' }}
                >{cat.icon} {cat.name}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {filteredVariants.map(v => {
                const catColor = categoryColors[v.category] || '#64748b';
                const diffLabel = v.difficulty === 'easy' ? 'Лёгкий' : v.difficulty === 'medium' ? 'Средний' : 'Сложный';
                const diffColor = v.difficulty === 'easy' ? '#10b981' : v.difficulty === 'medium' ? '#f59e0b' : '#ef4444';
                return (
                  <div key={v.id} onClick={() => handleSelectVariant(v)}
                    style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ height: 5, background: catColor }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <strong style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.3 }}>{v.name}</strong>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: diffColor + '18', color: diffColor, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{diffLabel}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{v.description}</p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                        <span>📦 {v.slots?.filter(s => s.type !== 'waypoint').length || 0} блоков</span>
                        <span>⏱ {Math.floor((v.timeLimit || 300) / 60)} мин</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== ГЛАВНОЕ МЕНЮ ==========
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)',
      padding: '40px 20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Декоративные круги */}
      <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -160, left: -160, width: 600, height: 600, borderRadius: '50%', background: 'rgba(16,185,129,0.05)', pointerEvents: 'none' }} />

      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24, color: '#a5b4fc', fontSize: 13, fontWeight: 500 }}>
          ⚡ Образовательная платформа
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: '0 0 14px', lineHeight: 1.25, maxWidth: 640 }}>
          Приложение для отработки и контроля навыков обучающихся по
          <span style={{ background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> составлению блок-схем</span>
        </h1>
      </div>

      {/* Карточки режимов */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 320px)', gap: 20, marginBottom: 44 }}>
        {[
          {
            mode: 'learn', gradient: 'linear-gradient(135deg, #059669, #10b981)', lightColor: '#d1fae5',
            icon: '📖', title: 'Обучение', badge: 'Начни здесь',
            desc: 'Изучай алгоритмы с подсказками и без ограничений по времени',
            features: ['Подсказки включены', 'Без таймера', 'Можно исправлять ошибки'],
          },
          {
            mode: 'practice', gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', lightColor: '#dbeafe',
            icon: '✏️', title: 'Тренировка', badge: null,
            desc: 'Проверяй свои знания самостоятельно без подсказок',
            features: ['Без подсказок', 'Без таймера', 'Результат после сдачи'],
          },
          {
            mode: 'exam', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', lightColor: '#fee2e2',
            icon: '🎓', title: 'Экзамен', badge: null,
            desc: 'Сдай экзамен в условиях ограниченного времени',
            features: ['Таймер включён', 'Без подсказок', 'Проходной балл: 70%'],
          },
        ].map(item => (
          <div
            key={item.mode}
            onClick={() => { setLearningMode(item.mode); setMode('variantSelect'); }}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 28px 56px rgba(0,0,0,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ background: item.gradient, padding: '22px 24px 18px', position: 'relative' }}>
              {item.badge && (
                <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: 'white', fontWeight: 600, letterSpacing: '0.03em' }}>
                  {item.badge}
                </span>
              )}
              <div style={{ fontSize: 36, marginBottom: 10 }}>{item.icon}</div>
              <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>{item.title}</h2>
            </div>
            <div style={{ padding: '18px 24px 22px' }}>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 16, lineHeight: 1.55 }}>{item.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {item.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Нажмите чтобы выбрать вариант →</div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка админки */}
      <button
        onClick={() => setMode('admin')}
        style={{ padding: '10px 26px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 40, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
      >
        🔧 Панель управления
      </button>
    </div>
  );
}

export default App;