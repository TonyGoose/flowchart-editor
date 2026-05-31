import dagre from '@dagrejs/dagre';

const NODE_W = 150, NODE_H = 70;

/**
 * Авто-разметка варианта: принимает {slots, arrows},
 * возвращает вариант с обновлёнными x,y у слотов и fromSide/toSide у стрелок.
 */
export function autoLayoutVariant(variant) {
  const { slots = [], arrows = [] } = variant;
  if (slots.length === 0) return variant;

  // ── Строим граф dagre ─────────────────────────────────────────
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 110, marginx: 60, marginy: 50 });

  slots.forEach(s => g.setNode(String(s.id), { width: NODE_W, height: NODE_H }));
  arrows.forEach(a => g.setEdge(String(a.from), String(a.to)));

  dagre.layout(g);

  // ── Собираем позиции (dagre возвращает центр) ─────────────────
  const positions = {};
  slots.forEach(s => {
    const n = g.node(String(s.id));
    if (n) positions[s.id] = { x: Math.round(n.x - NODE_W / 2), y: Math.round(n.y - NODE_H / 2) };
  });

  // ── Находим обратные рёбра (циклы) через DFS ─────────────────
  const backPairs = new Set();
  const color = {};
  slots.forEach(s => color[s.id] = 0);
  const succMap = {};
  slots.forEach(s => succMap[s.id] = []);
  arrows.forEach(a => succMap[a.from]?.push(a.to));

  const dfs = id => {
    color[id] = 1;
    (succMap[id] || []).forEach(to => {
      if (color[to] === 1)      backPairs.add(`${id}→${to}`);
      else if (color[to] === 0) dfs(to);
    });
    color[id] = 2;
  };
  const start = slots.find(s => s.type === 'start') || slots[0];
  dfs(start.id);
  slots.forEach(s => { if (color[s.id] === 0) dfs(s.id); });

  // ── Обновляем слоты ───────────────────────────────────────────
  const newSlots = slots.map(s => ({ ...s, ...(positions[s.id] || {}) }));

  // ── Обновляем стороны стрелок ─────────────────────────────────
  const newArrows = arrows.map(a => {
    const from = newSlots.find(s => s.id === a.from);
    const to   = newSlots.find(s => s.id === a.to);
    if (!from || !to) return a;

    const fCx = from.x + NODE_W / 2, fCy = from.y + NODE_H / 2;
    const tCx = to.x   + NODE_W / 2, tCy = to.y   + NODE_H / 2;
    const dx = tCx - fCx, dy = tCy - fCy;
    const isBack = backPairs.has(`${a.from}→${a.to}`);

    let fromSide = 'bottom', toSide = 'top';

    if (isBack) {
      fromSide = 'right'; toSide = 'top';
    } else if (Math.abs(dy) >= Math.abs(dx)) {
      fromSide = dy >= 0 ? 'bottom' : 'top';
      toSide   = dy >= 0 ? 'top'    : 'bottom';
    } else {
      fromSide = dx > 0 ? 'right' : 'left';
      toSide   = dx > 0 ? 'left'  : 'right';
    }

    // Ромб: ветки «да»/«нет» выходят сбоку при горизонтальном смещении
    if (from.type === 'decision' && !isBack && (a.label === 'да' || a.label === 'нет')) {
      if (Math.abs(dx) > 40) {
        fromSide = dx > 0 ? 'right' : 'left';
        toSide   = 'top';
      }
    }

    return { ...a, fromSide, toSide };
  });

  return { ...variant, slots: newSlots, arrows: newArrows };
}

// Размеры блоков для лейаута
const getNodeDimensions = (node) => {
  switch (node.type) {
    case 'start':
    case 'end':
      return { width: 120, height: 60 };
    case 'decision':
      return { width: 100, height: 100 };
    case 'trap':
      return { width: 140, height: 70 };
    default:
      return { width: 150, height: 65 };
  }
};

export const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  if (!nodes.length) return { nodes, edges };
  
  // Создаём граф
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,  // TB - сверху вниз
    nodesep: 80,         // расстояние между узлами по горизонтали
    ranksep: 100,        // расстояние между уровнями по вертикали
    marginx: 50,
    marginy: 50
  });
  
  // Добавляем узлы в граф
  nodes.forEach((node) => {
    const dimensions = getNodeDimensions(node);
    dagreGraph.setNode(node.id, { 
      width: dimensions.width, 
      height: dimensions.height 
    });
  });
  
  // Добавляем рёбра в граф
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Выполняем расчёт layout
  dagre.layout(dagreGraph);
  
  // Получаем новые позиции для узлов
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dimensions = getNodeDimensions(node);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
      positionAbsolute: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      }
    };
  });
  
  return { nodes: layoutedNodes, edges };
};