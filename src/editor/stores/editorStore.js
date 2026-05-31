// src/editor/stores/editorStore.js
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from 'reactflow';

const useEditorStore = create((set, get) => ({
  nodes: [],
  edges: [],
  currentVariant: null,
  originalVariant: null,
  
  // Базовые сеттеры
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCurrentVariant: (variant) => set({ currentVariant: variant, originalVariant: JSON.parse(JSON.stringify(variant)) }),
  
  // Загрузка варианта в редактор
  loadVariant: (variant) => {
    if (!variant || !variant.slots) {
      console.error('Нет данных для загрузки');
      return;
    }
    
    const nodes = variant.slots.map(slot => {
      const block = variant.blocks?.find(b => b.text === slot.expectedText);
      return {
        id: String(slot.id),
        type: slot.type === 'trap' ? 'trap' : slot.type,
        position: { x: slot.x, y: slot.y },
        width: slot.type === 'decision' ? 90 : (slot.type === 'start' || slot.type === 'end' ? 120 : 150),
        height: slot.type === 'decision' ? 90 : 70,
        data: { 
          label: slot.expectedText, 
          type: slot.type,
          isCorrect: block?.isCorrect !== false,
          hint: block?.hint || '',
          isTrap: block?.isCorrect === false
        }
      };
    });
    
    const edges = (variant.arrows || []).map((arrow, idx) => ({
      id: `edge-${idx}-${Date.now()}`,
      source: String(arrow.from),
      target: String(arrow.to),
      label: arrow.label || null,
      fromSide: arrow.fromSide || 'bottom',
      toSide: arrow.toSide || 'top',
      type: 'custom',
      sourceHandle: arrow.fromSide || 'bottom',
      targetHandle: arrow.toSide || 'top',
      data: { 
        label: arrow.label || null, 
        isLoop: arrow.isLoop || false,
        fromSide: arrow.fromSide || 'bottom',
        toSide: arrow.toSide || 'top'
      }
    }));
    
    set({ nodes, edges });
  },
  
  // Добавление нового блока
  addNode: (newNode) => {
    let width = 150, height = 70;
    if (newNode.type === 'decision') { width = 90; height = 90; }
    else if (newNode.type === 'start' || newNode.type === 'end') { width = 120; height = 60; }
    
    set({ 
      nodes: [...get().nodes, { ...newNode, width, height }] 
    });
  },
  
  // Сохранение текущего варианта
  saveCurrentVariant: () => {
    const { nodes, edges, originalVariant } = get();
    
    const slots = nodes.map(node => ({
      id: parseInt(node.id),
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      type: node.data.type === 'trap' ? 'process' : node.data.type,
      expectedText: node.data.label
    }));
    
    const blocks = nodes.map(node => ({
      id: parseInt(node.id),
      text: node.data.label,
      type: node.data.type === 'trap' ? 'process' : node.data.type,
      isCorrect: node.data.isCorrect !== false,
      hint: node.data.hint || ''
    }));
    
    const arrows = edges.map(edge => ({
      from: parseInt(edge.source),
      to: parseInt(edge.target),
      label: edge.label || null,
      fromSide: edge.sourceHandle || 'bottom',
      toSide: edge.targetHandle || 'top',
      isLoop: edge.data?.isLoop || false
    }));
    
    const updatedVariant = {
      ...originalVariant,
      slots,
      blocks,
      arrows,
      updatedAt: new Date().toISOString()
    };
    
    set({ currentVariant: updatedVariant });
    return updatedVariant;
  },
  
  // Обработчики изменений React Flow
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  
  onConnect: (params) => {
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}-${Math.random()}`,
      fromSide: 'bottom',
      toSide: 'top',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'custom',
      data: { label: null, isLoop: false, fromSide: 'bottom', toSide: 'top' }
    };
    set({ edges: addEdge(newEdge, get().edges) });
  },
  
  // Удаление
  deleteNode: (nodeId) => {
    set({ 
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    });
  },
  
  deleteEdge: (edgeId) => {
    set({ edges: get().edges.filter(e => e.id !== edgeId) });
  },
  
  // Обновление данных блока
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)
    });
  },
  
  // НОВЫЙ МЕТОД - обновление позиции блока
  updateNodePosition: (nodeId, x, y) => {
    set({
      nodes: get().nodes.map(n => 
        n.id === nodeId ? { ...n, position: { x, y } } : n
      )
    });
  },
  
  // Обновление стрелки
  updateEdge: (edgeId, updates) => {
    set({
      edges: get().edges.map(e => {
        if (e.id !== edgeId) return e;
        const updated = { ...e, ...updates };
        updated.data = { ...e.data, ...updates };
        return updated;
      })
    });
  },
  
  updateEdgeLabel: (edgeId, label) => {
    set({
      edges: get().edges.map(e => 
        e.id === edgeId ? { ...e, label, data: { ...e.data, label } } : e
      )
    });
  },
  
  updateEdgeSourceHandle: (edgeId, fromSide) => {
    set({
      edges: get().edges.map(e => 
        e.id === edgeId ? { ...e, sourceHandle: fromSide, fromSide, data: { ...e.data, fromSide } } : e
      )
    });
  },
  
  updateEdgeTargetHandle: (edgeId, toSide) => {
    set({
      edges: get().edges.map(e => 
        e.id === edgeId ? { ...e, targetHandle: toSide, toSide, data: { ...e.data, toSide } } : e
      )
    });
  },
  
  toggleEdgeLoop: (edgeId) => {
    set({
      edges: get().edges.map(e => 
        e.id === edgeId ? { ...e, isLoop: !e.isLoop, data: { ...e.data, isLoop: !e.isLoop } } : e
      )
    });
  }
}));

updateEdgePoints: (edgeId, points) => {
  set({
    edges: get().edges.map(e =>
      e.id === edgeId ? { ...e, data: { ...e.data, points } } : e
    ),
  });
},

export default useEditorStore;