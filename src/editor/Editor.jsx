import React, { useCallback, useRef, useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  getBezierPath,
  getSmoothStepPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import StartEndNode from './nodes/StartEndNode';
import ProcessNode from './nodes/ProcessNode';
import DecisionNode from './nodes/DecisionNode';
import TrapNode from './nodes/TrapNode';
import WaypointNode from './nodes/WaypointNode';
import PredefinedProcessNode from './nodes/PredefinedProcessNode';
import DataNode from './nodes/DataNode';
import Sidebar from './Sidebar';

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  trap: TrapNode,
  waypoint: WaypointNode,
  predefined_process: PredefinedProcessNode,
  data: DataNode,
};

// Режимы стрелок
const EDGE_STYLES = {
  BEZIER: 'bezier',
  STEP: 'step'
};

// Стрелка с выбором стиля
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected, edgeStyle }) => {
  let edgePath;
  const currentStyle = data?.edgeStyle || edgeStyle || EDGE_STYLES.BEZIER;
  
  if (currentStyle === EDGE_STYLES.STEP) {
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition || 'bottom',
      targetPosition: targetPosition || 'top',
      borderRadius: 0
    });
    edgePath = path;
  } else {
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition: sourcePosition || 'bottom',
      targetPosition: targetPosition || 'top',
    });
    edgePath = path;
  }
  
  let strokeColor = '#64748b';
  if (data?.label === 'да') strokeColor = '#10b981';
  if (data?.label === 'нет') strokeColor = '#ef4444';
  
  const markerId = `arrow-${id}`;
  
  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill={strokeColor} />
        </marker>
      </defs>
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
      />
      {data?.label && (
        <text fill={strokeColor} fontSize="11" fontWeight="bold">
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            {data.label}
          </textPath>
        </text>
      )}
    </g>
  );
};

const edgeTypes = {
  custom: CustomEdge,
};

const EditorContent = ({ onSave, onCancel, initialVariant }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [panelTab, setPanelTab] = useState('props'); // 'props' | 'traps' | 'align'
  const [edgeStyle, setEdgeStyle] = useState(initialVariant?.edgeType || EDGE_STYLES.BEZIER);
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const didFitRef = useRef(false);
  const [panMode, setPanMode] = useState(false);
  const [spacePanning, setSpacePanning] = useState(false);

  // Ловушки — блоки без места на схеме, только в списке для студента
  const [trapBlocks, setTrapBlocks] = useState(() => {
    if (!initialVariant?.blocks) return [];
    return initialVariant.blocks.filter(b => b.isCorrect === false);
  });
  const [newTrapText, setNewTrapText] = useState('');
  const [newTrapType, setNewTrapType] = useState('process');
  const [newTrapHint, setNewTrapHint] = useState('');

  // Загрузка варианта
  useEffect(() => {
    if (initialVariant && initialVariant.slots) {
      setEdgeStyle(initialVariant.edgeType || EDGE_STYLES.BEZIER);
      
      const loadedNodes = initialVariant.slots.map(slot => ({
        id: String(slot.id),
        type: slot.type,
        position: { x: slot.x, y: slot.y },
        width: 150,
        height: 70,
        data: {
          label: slot.expectedText,
          type: slot.type,
          hint: initialVariant.blocks?.find(b => b.text === slot.expectedText)?.hint || '',
          isCorrect: initialVariant.blocks?.find(b => b.text === slot.expectedText)?.isCorrect !== false,
        }
      }));
      setNodes(loadedNodes);

      const loadedEdges = (initialVariant.arrows || []).map((arrow, idx) => ({
        id: `edge-${idx}`,
        source: String(arrow.from),
        target: String(arrow.to),
        label: arrow.label || null,
        type: 'custom',
        sourceHandle: arrow.fromSide || 'bottom',
        targetHandle: arrow.toSide || 'top',
        data: {
          label: arrow.label || null,
          edgeStyle: initialVariant.edgeType || EDGE_STYLES.BEZIER,
          toWaypoint: initialVariant.slots?.find(s => s.id === arrow.to)?.type === 'waypoint',
        }
      }));
      setEdges(loadedEdges);

      // Фитим вью после загрузки нод
      didFitRef.current = false;
    }
  }, [initialVariant]);

  // Фитим один раз когда rfInstance и ноды готовы
  useEffect(() => {
    if (rfInstance && nodes.length > 0 && !didFitRef.current) {
      didFitRef.current = true;
      rfInstance.fitView({ padding: 0.15, maxZoom: 1, duration: 400 });
    }
  }, [rfInstance, nodes.length]);

  // Клавиатурное управление режимами навигации
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      if (e.code === 'Space') { e.preventDefault(); setSpacePanning(true); }
      if (e.code === 'KeyH') setPanMode(true);
      if (e.code === 'KeyV') setPanMode(false);
      if (e.key === 'Escape') setPanMode(false);
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') setSpacePanning(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onConnect = useCallback((params) => {
    // ReactFlow передаёт точные ID хэндлов от которых/к которым потянули.
    // Используем их напрямую — не перезаписываем авторасчётом.
    // Если хэндл не определён (соединение без конкретного хэндла) — считаем по позициям.
    let fromSide = params.sourceHandle || null;
    let toSide   = params.targetHandle || null;

    if (!fromSide || !toSide) {
      const fromNode = nodes.find(n => n.id === params.source);
      const toNode   = nodes.find(n => n.id === params.target);
      if (fromNode && toNode) {
        const fCx = fromNode.position.x + 75, fCy = fromNode.position.y + 35;
        const tCx = toNode.position.x   + 75, tCy = toNode.position.y   + 35;
        const dx = tCx - fCx, dy = tCy - fCy;
        if (Math.abs(dx) > Math.abs(dy)) {
          fromSide = fromSide || (dx > 0 ? 'right' : 'left');
          toSide   = toSide   || (dx > 0 ? 'left'  : 'right');
        } else {
          fromSide = fromSide || (dy > 0 ? 'bottom' : 'top');
          toSide   = toSide   || (dy > 0 ? 'top'    : 'bottom');
        }
      }
    }

    const toNode = nodes.find(n => n.id === params.target);
    const newEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      type: 'custom',
      sourceHandle: fromSide || 'bottom',
      targetHandle: toSide   || 'top',
      data: { label: null, toWaypoint: toNode?.type === 'waypoint' },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [nodes]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setPanelTab('props');
  };

  const onEdgeClick = (event, edge) => {
    setSelectedEdge(edge);
    setPanelTab('props');
    setSelectedNode(null);
  };

  // Управление блоками
  const updateNodeLabel = (nodeId, label) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label } } : n));
  };

  const updateNodeHint = (nodeId, hint) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, hint } } : n));
  };

  const updateNodeIsCorrect = (nodeId, isCorrect) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isCorrect } } : n));
  };

  const updateNodePosition = (nodeId, x, y) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position: { x, y } } : n));
  };

  const moveNode = (dx, dy) => {
    if (!selectedNode) return;
    const current = nodes.find(n => n.id === selectedNode.id);
    if (!current) return;
    updateNodePosition(selectedNode.id, current.position.x + dx, current.position.y + dy);
  };

  // Управление стрелками
  const updateEdgeLabel = (edgeId, label) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, label, data: { ...e.data, label } } : e));
  };

  const updateEdgeSourceHandle = (edgeId, handle) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, sourceHandle: handle } : e));
  };

  const updateEdgeTargetHandle = (edgeId, handle) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, targetHandle: handle } : e));
  };

  const updateAllEdgesStyle = (style) => {
    setEdges(prev => prev.map(e => ({ ...e, data: { ...e.data, edgeStyle: style } })));
  };

  const autoLayout = () => {
    if (nodes.length === 0) return;

    const NODE_W = 150, NODE_H = 70, H_GAP = 80, V_GAP = 100, CENTER_X = 400;

    // Строим граф
    const succ = {}, pred = {};
    nodes.forEach(n => { succ[n.id] = []; pred[n.id] = []; });
    edges.forEach(e => {
      succ[e.source]?.push({ eid: e.id, target: e.target });
      pred[e.target]?.push({ eid: e.id, source: e.source });
    });

    // DFS для поиска обратных рёбер (циклы/петли)
    const backEdges = new Set();
    const color = {};
    nodes.forEach(n => { color[n.id] = 0; });
    const dfs = id => {
      color[id] = 1;
      (succ[id] || []).forEach(({ eid, target }) => {
        if (color[target] === 1) backEdges.add(eid);
        else if (color[target] === 0) dfs(target);
      });
      color[id] = 2;
    };
    nodes.forEach(n => { if (color[n.id] === 0) dfs(n.id); });

    // Топологическая сортировка (без обратных рёбер)
    const topoVis = new Set(), topo = [];
    const topoVisit = id => {
      if (topoVis.has(id)) return;
      topoVis.add(id);
      (succ[id] || []).forEach(({ eid, target }) => { if (!backEdges.has(eid)) topoVisit(target); });
      topo.unshift(id);
    };
    nodes.forEach(n => topoVisit(n.id));

    // Ранг = длиннейший путь от начала (longest path)
    const rank = {};
    nodes.forEach(n => { rank[n.id] = 0; });
    topo.forEach(id => {
      (succ[id] || []).forEach(({ eid, target }) => {
        if (!backEdges.has(eid))
          rank[target] = Math.max(rank[target] || 0, (rank[id] || 0) + 1);
      });
    });

    // Группируем по рангу
    const groups = {};
    nodes.forEach(n => {
      const r = rank[n.id] || 0;
      if (!groups[r]) groups[r] = [];
      groups[r].push(n.id);
    });

    // Назначаем X: медиана X предшественников
    const xPos = {};
    Object.keys(groups).map(Number).sort((a, b) => a - b).forEach(r => {
      const ids = groups[r];
      if (ids.length === 1) {
        const id = ids[0];
        const pxs = (pred[id] || [])
          .filter(({ eid }) => !backEdges.has(eid))
          .map(({ source }) => xPos[source])
          .filter(x => x != null);
        xPos[id] = pxs.length
          ? pxs.reduce((a, b) => a + b, 0) / pxs.length
          : CENTER_X;
      } else {
        const scored = ids.map(id => {
          const pxs = (pred[id] || [])
            .filter(({ eid }) => !backEdges.has(eid))
            .map(({ source }) => xPos[source])
            .filter(x => x != null);
          return { id, score: pxs.length ? pxs.reduce((a, b) => a + b, 0) / pxs.length : CENTER_X };
        }).sort((a, b) => a.score - b.score);

        const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP;
        const x0 = CENTER_X - totalW / 2 + NODE_W / 2;
        scored.forEach(({ id }, i) => { xPos[id] = x0 + i * (NODE_W + H_GAP); });
      }
    });

    // Применяем позиции
    const positioned = nodes.map(n => ({
      ...n,
      position: {
        x: Math.round((xPos[n.id] || CENTER_X) - NODE_W / 2),
        y: Math.round((rank[n.id] || 0) * (NODE_H + V_GAP) + 40),
      }
    }));
    setNodes(positioned);

    // Обновляем хэндлы рёбер по новым позициям
    setEdges(prev => prev.map(edge => {
      const from = positioned.find(n => n.id === edge.source);
      const to   = positioned.find(n => n.id === edge.target);
      if (!from || !to) return edge;

      const dx = (to.position.x + NODE_W / 2) - (from.position.x + NODE_W / 2);
      const dy = (to.position.y + NODE_H / 2) - (from.position.y + NODE_H / 2);
      const isBack = backEdges.has(edge.id);

      let fromSide, toSide;
      if (isBack) {
        // Обратное ребро (цикл): выход справа, вход сверху
        fromSide = 'right';
        toSide = 'top';
      } else if (Math.abs(dy) >= Math.abs(dx)) {
        fromSide = dy >= 0 ? 'bottom' : 'top';
        toSide   = dy >= 0 ? 'top'    : 'bottom';
      } else {
        fromSide = dx > 0 ? 'right' : 'left';
        toSide   = dx > 0 ? 'left'  : 'right';
      }

      // Блок решения: «да» всегда вправо, «нет» влево (если не обратное ребро)
      if (!isBack && from.type === 'decision') {
        const label = edge.data?.label || edge.label;
        if (label === 'да') {
          fromSide = dx >= 0 ? 'right' : 'bottom';
          toSide   = dx >= 0 ? 'left'  : 'top';
        } else if (label === 'нет') {
          fromSide = dx <= 0 ? 'left'  : 'bottom';
          toSide   = dx <= 0 ? 'right' : 'top';
        }
      }

      return { ...edge, sourceHandle: fromSide, targetHandle: toSide };
    }));
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const deleteEdge = (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelectedEdge(null);
  };

  // Добавить точку (waypoint) на стрелку — РАЗРЕЗАЕТ её на A→W + W→B.
  // Стороны хэндлов вычисляются по реальной геометрии, а не хардкодятся.
  const addWaypointNearEdge = (edgeId, clickPos = null) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const fromNode = nodes.find(n => n.id === edge.source);
    const toNode   = nodes.find(n => n.id === edge.target);

    let wpX, wpY;
    if (clickPos) {
      wpX = Math.round(clickPos.x) - 8;
      wpY = Math.round(clickPos.y) - 8;
    } else {
      if (!fromNode || !toNode) return;
      wpX = Math.round((fromNode.position.x + 75 + toNode.position.x + 75) / 2) - 8;
      wpY = Math.round((fromNode.position.y + 35 + toNode.position.y + 35) / 2) - 8;
    }

    // Центр точки
    const wCx = wpX + 8, wCy = wpY + 8;

    // Вычисляем стороны: из A в W и из W в B
    const sideAtoW = (() => {
      if (!fromNode) return { src: edge.sourceHandle || 'bottom', tgt: 'top' };
      const fCx = fromNode.position.x + 75, fCy = fromNode.position.y + 35;
      const dx = wCx - fCx, dy = wCy - fCy;
      if (Math.abs(dy) >= Math.abs(dx)) {
        return { src: dy >= 0 ? 'bottom' : 'top', tgt: dy >= 0 ? 'top' : 'bottom' };
      }
      return { src: dx >= 0 ? 'right' : 'left', tgt: dx >= 0 ? 'left' : 'right' };
    })();

    const sideWtoB = (() => {
      if (!toNode) return { src: 'bottom', tgt: edge.targetHandle || 'top' };
      const tCx = toNode.position.x + 75, tCy = toNode.position.y + 35;
      const dx = tCx - wCx, dy = tCy - wCy;
      if (Math.abs(dy) >= Math.abs(dx)) {
        return { src: dy >= 0 ? 'bottom' : 'top', tgt: dy >= 0 ? 'top' : 'bottom' };
      }
      return { src: dx >= 0 ? 'right' : 'left', tgt: dx >= 0 ? 'left' : 'right' };
    })();

    const wpId = `${Date.now()}`;
    const waypointNode = {
      id: wpId, type: 'waypoint',
      position: { x: wpX, y: wpY },
      data: { label: '' },
    };
    const edge1 = {
      id: `edge-${Date.now()}-a`, type: 'custom',
      source: edge.source, target: wpId,
      sourceHandle: sideAtoW.src,
      targetHandle: sideAtoW.tgt,
      data: { ...(edge.data || {}), toWaypoint: true },
    };
    const edge2 = {
      id: `edge-${Date.now()}-b`, type: 'custom',
      source: wpId, target: edge.target,
      sourceHandle: sideWtoB.src,
      targetHandle: sideWtoB.tgt,
      data: { ...(edge.data || {}), toWaypoint: false },
    };

    setNodes(prev => [...prev, waypointNode]);
    setEdges(prev => [...prev.filter(e => e.id !== edgeId), edge1, edge2]);
    setSelectedEdge(null);
    setSelectedNode(null);
  };

  // Двойной клик по стрелке — добавить точку в месте клика (разрезает стрелку)
  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (!rfInstance) return;
    const pos = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addWaypointNearEdge(edge.id, pos);
  }, [rfInstance, edges, nodes]);

  // Развернуть стрелку
  const reverseEdge = (edgeId) => {
    setEdges(prev => prev.map(e =>
      e.id === edgeId
        ? { ...e, source: e.target, target: e.source, sourceHandle: e.targetHandle, targetHandle: e.sourceHandle }
        : e
    ));
    setSelectedEdge(prev => prev?.id === edgeId
      ? { ...prev, source: prev.target, target: prev.source, sourceHandle: prev.targetHandle, targetHandle: prev.sourceHandle }
      : prev
    );
  };

  const handleSave = () => {
    const slots = nodes
      .map(node => ({
        id: parseInt(node.id),
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        type: node.type === 'trap' ? 'process' : node.type,
        expectedText: node.type === 'waypoint' ? '' : node.data.label,
      }))
      .filter(s => !isNaN(s.id));

    // Блоки схемы (правильные) + ловушки из отдельного списка
    const diagramBlocks = nodes
      .filter(node => node.type !== 'waypoint')
      .map(node => ({
        id: parseInt(node.id),
        text: node.data.label,
        type: node.type === 'trap' ? 'process' : node.type,
        isCorrect: true,
        hint: node.data.hint || '',
      }));

    const maxId = diagramBlocks.reduce((m, b) => Math.max(m, b.id), 0);
    const savedTraps = trapBlocks.map((tb, i) => ({
      id: maxId + i + 1,
      text: tb.text,
      type: tb.type || 'process',
      isCorrect: false,
      hint: tb.hint || '',
    }));

    const blocks = [...diagramBlocks, ...savedTraps];

    const arrows = edges
      .map(edge => ({
        from: parseInt(edge.source),
        to: parseInt(edge.target),
        label: edge.data?.label || edge.label || null,
        fromSide: edge.sourceHandle || 'bottom',
        toSide: edge.targetHandle || 'top',
      }))
      // Отбрасываем стрелки с некорректными ID (NaN возникал при "wp-" префиксе)
      .filter(a => !isNaN(a.from) && !isNaN(a.to));
    
    const savedVariant = {
      ...initialVariant,
      slots,
      blocks,
      arrows,
      edgeType: edgeStyle,
      updatedAt: new Date().toISOString()
    };
    
    onSave(savedVariant);
  };

  const handleStyleChange = (style) => {
    setEdgeStyle(style);
    updateAllEdgesStyle(style);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('type');
    const label = event.dataTransfer.getData('label');
    const isCorrect = event.dataTransfer.getData('isCorrect') === 'true';
    const hint = event.dataTransfer.getData('hint');
    
    if (!type || !rfInstance) return;
    
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    const isWaypoint = type === 'waypoint';
    const newNode = {
      id: `${Date.now()}`,
      type: isWaypoint ? 'waypoint' : type === 'trap' ? 'trap' : type,
      position: isWaypoint
        ? { x: position.x - 8, y: position.y - 8 }
        : position,
      ...(isWaypoint ? {} : { width: 150, height: 70 }),
      data: isWaypoint
        ? { label: '' }
        : { label, type, isCorrect, hint },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Выравнивание блоков
  const alignNodes = (alignment) => {
    const selectedNodes = nodes.filter(n => n.selected === true);
    
    if (selectedNodes.length < 2) {
      alert('Выберите минимум 2 блока (зажми Shift + клик на блоки)');
      return;
    }

    let newNodes = [...nodes];
    
    if (alignment === 'left') {
      const minX = Math.min(...selectedNodes.map(n => n.position.x));
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, x: minX } };
      });
    } 
    else if (alignment === 'right') {
      const maxX = Math.max(...selectedNodes.map(n => n.position.x + 150));
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, x: maxX - 150 } };
      });
    }
    else if (alignment === 'top') {
      const minY = Math.min(...selectedNodes.map(n => n.position.y));
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, y: minY } };
      });
    }
    else if (alignment === 'bottom') {
      const maxY = Math.max(...selectedNodes.map(n => n.position.y + 70));
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, y: maxY - 70 } };
      });
    }
    else if (alignment === 'center-h') {
      const centerX = selectedNodes.reduce((sum, n) => sum + n.position.x + 75, 0) / selectedNodes.length;
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, x: centerX - 75 } };
      });
    }
    else if (alignment === 'center-v') {
      const centerY = selectedNodes.reduce((sum, n) => sum + n.position.y + 35, 0) / selectedNodes.length;
      selectedNodes.forEach(node => {
        const index = newNodes.findIndex(n => n.id === node.id);
        newNodes[index] = { ...node, position: { ...node.position, y: centerY - 35 } };
      });
    }
    else if (alignment === 'distribute-h') {
      const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
      const spacing = (sorted[sorted.length-1].position.x - sorted[0].position.x) / (sorted.length - 1);
      sorted.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        const newX = sorted[0].position.x + i * spacing;
        newNodes[index] = { ...node, position: { ...node.position, x: newX } };
      });
    }
    else if (alignment === 'distribute-v') {
      const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
      const spacing = (sorted[sorted.length-1].position.y - sorted[0].position.y) / (sorted.length - 1);
      sorted.forEach((node, i) => {
        const index = newNodes.findIndex(n => n.id === node.id);
        const newY = sorted[0].position.y + i * spacing;
        newNodes[index] = { ...node, position: { ...node.position, y: newY } };
      });
    }

    setNodes(newNodes);
  };

  const sides = [
    { value: 'top', label: '⬆️ Сверху', icon: '↑' },
    { value: 'bottom', label: '⬇️ Снизу', icon: '↓' },
    { value: 'left', label: '⬅️ Слева', icon: '←' },
    { value: 'right', label: '➡️ Справа', icon: '→' }
  ];

  const isGrabMode = panMode || spacePanning;

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', whiteSpace: 'nowrap' }}>✏️ Редактор</span>
          <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {isGrabMode ? '✋ Режим перемещения — кликни и тяни холст' : '↖ Режим выбора — тяни блоки, соединяй кружки'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Режим навигации */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setPanMode(false)}
              title="Режим выбора — V"
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: !panMode ? '#3b82f6' : 'transparent',
                color: !panMode ? 'white' : '#64748b',
                transition: 'all 0.15s',
              }}
            >↖ Выбор</button>
            <button
              onClick={() => setPanMode(true)}
              title="Режим руки — H или Пробел"
              style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: panMode ? '#3b82f6' : spacePanning ? '#e0f2fe' : 'transparent',
                color: panMode ? 'white' : spacePanning ? '#0369a1' : '#64748b',
                transition: 'all 0.15s',
              }}
            >✋ Рука</button>
          </div>

          {/* Зум */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
            <button onClick={() => rfInstance?.zoomOut({ duration: 200 })} title="Уменьшить (Ctrl −)" style={{ padding: '5px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#475569', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>−</button>
            <button onClick={() => rfInstance?.fitView({ padding: 0.15, maxZoom: 1, duration: 300 })} title="Вписать схему" style={{ padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#475569', fontSize: 12, fontWeight: 600 }}>⊡ Вписать</button>
            <button onClick={() => rfInstance?.zoomIn({ duration: 200 })} title="Увеличить (Ctrl +)" style={{ padding: '5px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#475569', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>+</button>
          </div>

          {/* Стиль стрелок */}
          <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 3, border: '1px solid #e2e8f0' }}>
            <button onClick={() => handleStyleChange(EDGE_STYLES.BEZIER)} title="Кривые стрелки" style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: edgeStyle === EDGE_STYLES.BEZIER ? '#3b82f6' : 'transparent', color: edgeStyle === EDGE_STYLES.BEZIER ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>⭕ Кривые</button>
            <button onClick={() => handleStyleChange(EDGE_STYLES.STEP)} title="Прямые стрелки (90°)" style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: edgeStyle === EDGE_STYLES.STEP ? '#3b82f6' : 'transparent', color: edgeStyle === EDGE_STYLES.STEP ? 'white' : '#64748b', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>📐 Прямые</button>
          </div>

          <div style={{ width: 1, height: 28, background: '#e2e8f0' }} />
          <button onClick={onCancel} style={{ padding: '7px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Отмена</button>
          <button onClick={handleSave} style={{ padding: '7px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>💾 Сохранить</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, position: 'relative', cursor: isGrabMode ? 'grab' : 'default' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges.map(edge => ({ ...edge, data: { ...edge.data, edgeStyle: edgeStyle } }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={isGrabMode ? undefined : onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={isGrabMode ? undefined : onNodeClick}
            onEdgeClick={isGrabMode ? undefined : onEdgeClick}
            onEdgeDoubleClick={isGrabMode ? undefined : onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
            minZoom={0.05}
            maxZoom={2}
            deleteKeyCode={isGrabMode ? null : ['Delete', 'Backspace']}
            snapToGrid={!isGrabMode}
            snapGrid={[20, 20]}
            defaultEdgeOptions={{ type: 'custom' }}
            elevateEdgesOnSelect={true}
            connectionMode="loose"
            selectionKeyCode={isGrabMode ? null : ['Shift']}
            multiSelectionKeyCode={isGrabMode ? null : ['Shift']}
            selectionMode="partial"
            panOnDrag={isGrabMode ? true : [1, 2]}
            nodesDraggable={!isGrabMode}
            nodesConnectable={!isGrabMode}
            zoomOnScroll={true}
            preventScrolling={true}
          >
            <Background variant="dots" gap={20} size={1} />
            <Controls />
            <MiniMap nodeColor={(node) => {
              if (node.type === 'start') return '#10b981';
              if (node.type === 'end') return '#8b5cf6';
              if (node.type === 'decision') return '#f59e0b';
              if (node.data?.isCorrect === false) return '#ef4444';
              return '#3b82f6';
            }} />
          </ReactFlow>
        </div>
        
        <div style={{ width: '340px', background: '#1e1e2e', borderLeft: '1px solid #313244', display: 'flex', flexDirection: 'column', color: '#cdd6f4' }}>
          {/* Таб-навигация */}
          <div style={{ display: 'flex', borderBottom: '1px solid #313244', flexShrink: 0 }}>
            {[
              { id: 'props', label: 'Свойства', icon: '✏️' },
              { id: 'traps', label: 'Ловушки',  icon: '⚠️' },
              { id: 'align', label: 'Разметка', icon: '📏' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPanelTab(tab.id)}
                style={{
                  flex: 1, padding: '10px 4px', border: 'none', cursor: 'pointer',
                  background: panelTab === tab.id ? '#313244' : 'transparent',
                  color: panelTab === tab.id ? '#cdd6f4' : '#6c7086',
                  borderBottom: panelTab === tab.id ? '2px solid #89b4fa' : '2px solid transparent',
                  fontSize: 11, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <div>{tab.icon}</div>
                <div style={{ marginTop: 2 }}>{tab.label}</div>
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {/* ── ТАБ: СВОЙСТВА ── */}
          {panelTab === 'props' && selectedNode && (() => {
            const cur = nodes.find(n => n.id === selectedNode.id);
            if (!cur) return null;
            const x = Math.round(cur.position.x);
            const y = Math.round(cur.position.y);
            return (
              <div>
                {/* Заголовок */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f9e2af' }}>Свойства блока</span>
                  <button
                    onClick={() => deleteNode(cur.id)}
                    style={{ background: '#f38ba820', border: '1px solid #f38ba850', borderRadius: 8, padding: '5px 10px', color: '#f38ba8', cursor: 'pointer', fontSize: 12 }}
                  >
                    Удалить
                  </button>
                </div>

                {/* Текст */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Текст блока</label>
                  <input
                    type="text"
                    value={cur.data.label}
                    onChange={(e) => updateNodeLabel(cur.id, e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {/* Подсказка */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Подсказка</label>
                  <input
                    type="text"
                    value={cur.data.hint || ''}
                    onChange={(e) => updateNodeHint(cur.id, e.target.value)}
                    placeholder="Для студентов в режиме обучения"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                {/* Координаты */}
                <div style={{ background: '#181825', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
                  <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Координаты</p>

                  {/* X */}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 11, color: '#6c7086' }}>X — горизонталь</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 36px', gap: 5 }}>
                      <button
                        onClick={() => moveNode(-10, 0)}
                        style={{ padding: '7px 0', background: '#313244', border: 'none', borderRadius: 7, color: '#cdd6f4', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}
                      >−</button>
                      <input
                        type="number"
                        value={x}
                        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateNodePosition(cur.id, v, cur.position.y); }}
                        style={{ padding: '7px 0', borderRadius: 7, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 13, textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => moveNode(10, 0)}
                        style={{ padding: '7px 0', background: '#313244', border: 'none', borderRadius: 7, color: '#cdd6f4', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}
                      >+</button>
                    </div>
                  </div>

                  {/* Y */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 5, fontSize: 11, color: '#6c7086' }}>Y — вертикаль</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 36px', gap: 5 }}>
                      <button
                        onClick={() => moveNode(0, -10)}
                        style={{ padding: '7px 0', background: '#313244', border: 'none', borderRadius: 7, color: '#cdd6f4', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}
                      >−</button>
                      <input
                        type="number"
                        value={y}
                        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateNodePosition(cur.id, cur.position.x, v); }}
                        style={{ padding: '7px 0', borderRadius: 7, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 13, textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                      />
                      <button
                        onClick={() => moveNode(0, 10)}
                        style={{ padding: '7px 0', background: '#313244', border: 'none', borderRadius: 7, color: '#cdd6f4', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}
                      >+</button>
                    </div>
                  </div>

                  {/* Быстрые шаги */}
                  <p style={{ margin: '0 0 6px', fontSize: 10, color: '#45475a' }}>Шаг ±1</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                    {[['←', -1, 0], ['→', 1, 0], ['↑', 0, -1], ['↓', 0, 1]].map(([label, dx, dy]) => (
                      <button
                        key={label}
                        onClick={() => moveNode(dx, dy)}
                        style={{ padding: '6px 0', background: '#313244', border: 'none', borderRadius: 6, color: '#a6adc8', cursor: 'pointer', fontSize: 14 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Правильный блок */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', background: '#181825', borderRadius: 10 }}>
                  <input
                    type="checkbox"
                    checked={cur.data.isCorrect !== false}
                    onChange={(e) => updateNodeIsCorrect(cur.id, e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: 13, color: '#cdd6f4', fontWeight: 500 }}>Правильный блок</div>
                    <div style={{ fontSize: 11, color: '#6c7086', marginTop: 2 }}>Снимите, чтобы сделать ловушкой</div>
                  </div>
                </label>
              </div>
            );
          })()}
          
          {panelTab === 'props' && !selectedNode && !selectedEdge && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#6c7086' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>👆</div>
              <p style={{ fontSize: 13 }}>Кликните на блок или стрелку</p>
              <p style={{ fontSize: 11, marginTop: 6, color: '#45475a' }}>Двойной клик по стрелке — добавить точку</p>
              <p style={{ fontSize: 11, marginTop: 4, color: '#45475a' }}>Shift + клик — выделить несколько</p>
            </div>
          )}

          {panelTab === 'props' && selectedEdge && (
            <div>
              {/* Заголовок */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f9e2af' }}>Свойства стрелки</span>
                <button onClick={() => deleteEdge(selectedEdge.id)} style={{ background: '#f38ba820', border: '1px solid #f38ba850', borderRadius: 8, padding: '5px 10px', color: '#f38ba8', cursor: 'pointer', fontSize: 12 }}>Удалить</button>
              </div>

              {/* Действия со стрелкой */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                <button
                  onClick={() => reverseEdge(selectedEdge.id)}
                  style={{ padding: '8px 0', background: '#313244', border: '1px solid #45475a', borderRadius: 9, color: '#cdd6f4', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                >
                  ⇄ Развернуть
                </button>
                <button
                  onClick={() => addWaypointNearEdge(selectedEdge.id)}
                  style={{ padding: '8px 0', background: '#313244', border: '1px solid #45475a', borderRadius: 9, color: '#a6adc8', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                >
                  ● Добавить точку
                </button>
              </div>

              {/* Подпись */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Подпись</label>
                <input type="text" value={selectedEdge.data?.label || selectedEdge.label || ''} onChange={(e) => updateEdgeLabel(selectedEdge.id, e.target.value)} placeholder="да / нет" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                <button onClick={() => updateEdgeLabel(selectedEdge.id, 'да')}  style={{ flex: 1, padding: '7px 0', background: '#a6e3a120', border: '1px solid #a6e3a150', borderRadius: 8, color: '#a6e3a1', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>да</button>
                <button onClick={() => updateEdgeLabel(selectedEdge.id, 'нет')} style={{ flex: 1, padding: '7px 0', background: '#f38ba820', border: '1px solid #f38ba850', borderRadius: 8, color: '#f38ba8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>нет</button>
                <button onClick={() => updateEdgeLabel(selectedEdge.id, '')}   style={{ flex: 1, padding: '7px 0', background: '#45475a', border: 'none', borderRadius: 8, color: '#a6adc8', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>

              {/* Откуда */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Выход из блока</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {sides.map(s => (
                    <button key={s.value} onClick={() => updateEdgeSourceHandle(selectedEdge.id, s.value)}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, background: selectedEdge.sourceHandle === s.value ? '#89b4fa' : '#313244', color: selectedEdge.sourceHandle === s.value ? '#1e1e2e' : '#cdd6f4' }}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Куда */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Вход в блок</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {sides.map(s => (
                    <button key={s.value} onClick={() => updateEdgeTargetHandle(selectedEdge.id, s.value)}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, background: selectedEdge.targetHandle === s.value ? '#89b4fa' : '#313244', color: selectedEdge.targetHandle === s.value ? '#1e1e2e' : '#cdd6f4' }}>
                      {s.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* ── ТАБ: ЛОВУШКИ ── */}
          {panelTab === 'traps' && (
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#f38ba8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚠ Ловушки · {trapBlocks.length}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: '#6c7086', lineHeight: 1.4 }}>
                Студент видит их в списке блоков, но на схеме они не отображаются
              </p>

              {trapBlocks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#45475a', fontSize: 12 }}>Ловушек нет</div>
              )}

              {trapBlocks.map((tb, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '7px 10px', background: '#2a1420', borderRadius: 9, border: '1px solid #4a1030' }}>
                  <span style={{ fontSize: 11, color: '#f38ba8', flex: 1, wordBreak: 'break-word' }}>
                    {tb.type === 'decision' ? '◇' : '▭'} {tb.text}
                  </span>
                  {tb.hint && <span title={tb.hint} style={{ fontSize: 14, cursor: 'default', flexShrink: 0 }}>💡</span>}
                  <button onClick={() => setTrapBlocks(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#f38ba8', cursor: 'pointer', fontSize: 15, flexShrink: 0, padding: 0 }}>✕</button>
                </div>
              ))}

              <div style={{ marginTop: 12, background: '#181825', borderRadius: 10, padding: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, color: '#6c7086', fontWeight: 600, textTransform: 'uppercase' }}>Добавить ловушку</p>
                <input value={newTrapText} onChange={e => setNewTrapText(e.target.value)} placeholder="Текст ловушки"
                  onKeyPress={e => { if (e.key === 'Enter' && newTrapText.trim()) { setTrapBlocks(prev => [...prev, { text: newTrapText.trim(), type: newTrapType, hint: newTrapHint.trim() }]); setNewTrapText(''); setNewTrapHint(''); } }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 12, marginBottom: 7, boxSizing: 'border-box', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
                  {[['process','▭ Процесс'],['decision','◇ Ромб'],['start','⬭ Старт'],['end','⬭ Конец']].map(([val, lbl]) => (
                    <button key={val} onClick={() => setNewTrapType(val)}
                      style={{ flex: 1, padding: '5px 0', fontSize: 10, borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600,
                        background: newTrapType === val ? '#f38ba8' : '#313244', color: newTrapType === val ? '#1e1e2e' : '#a6adc8' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <input value={newTrapHint} onChange={e => setNewTrapHint(e.target.value)} placeholder="Подсказка (необязательно)"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #313244', background: '#313244', color: '#cdd6f4', fontSize: 11, marginBottom: 8, boxSizing: 'border-box', outline: 'none' }}
                />
                <button onClick={() => { if (!newTrapText.trim()) return; setTrapBlocks(prev => [...prev, { text: newTrapText.trim(), type: newTrapType, hint: newTrapHint.trim() }]); setNewTrapText(''); setNewTrapHint(''); }}
                  style={{ width: '100%', padding: '9px 0', background: '#f38ba8', border: 'none', borderRadius: 8, color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  + Добавить
                </button>
              </div>
            </div>
          )}

          {/* ── ТАБ: РАЗМЕТКА ── */}
          {panelTab === 'align' && (
            <div>
              <p style={{ margin: '0 0 10px', fontSize: 11, color: '#6c7086', lineHeight: 1.4 }}>
                Зажми <strong style={{ color: '#89b4fa' }}>Shift</strong> и кликай по блокам для множественного выделения, затем применяй выравнивание.
              </p>

              <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>По краю</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                {[['left','⬅ Лево'],['center-h','⬌ Центр X'],['right','➡ Право'],
                  ['top','⬆ Верх'],['center-v','⬍ Центр Y'],['bottom','⬇ Низ']].map(([a, l]) => (
                  <button key={a} onClick={() => alignNodes(a)}
                    style={{ padding: '8px 0', background: '#313244', border: 'none', borderRadius: 8, color: '#a6adc8', cursor: 'pointer', fontSize: 11 }}>{l}</button>
                ))}
              </div>

              <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Распределить равномерно</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
                <button onClick={() => alignNodes('distribute-h')} style={{ padding: '8px 0', background: '#313244', border: 'none', borderRadius: 8, color: '#a6adc8', cursor: 'pointer', fontSize: 11 }}>↔ По X</button>
                <button onClick={() => alignNodes('distribute-v')} style={{ padding: '8px 0', background: '#313244', border: 'none', borderRadius: 8, color: '#a6adc8', cursor: 'pointer', fontSize: 11 }}>↕ По Y</button>
              </div>

              <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 600, color: '#a6adc8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Авто-разметка всей схемы</p>
              <button onClick={autoLayout}
                style={{ width: '100%', padding: '10px 0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>
                ⚡ Авто-разметка
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

const Editor = ({ onSave, onCancel, initialVariant }) => {
  return (
    <ReactFlowProvider>
      <EditorContent onSave={onSave} onCancel={onCancel} initialVariant={initialVariant} />
    </ReactFlowProvider>
  );
};

export default Editor;