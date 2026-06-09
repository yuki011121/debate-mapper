import { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import dagre from '@dagrejs/dagre';
import 'reactflow/dist/style.css';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 116;
const AI_MISMATCH_THRESHOLD = 0.25;

function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 58, marginx: 30, marginy: 30 });

  nodes.forEach((node) => g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}

function relationColor(type) {
  return type === 'support' ? '#2f9461' : '#dc2626';
}

function crToStroke(score = 0) {
  return 1.4 + Math.pow(score, 1.2) * 4.2;
}

function edgeKey(edge) {
  return `${edge.from}=>${edge.to}:${edge.type}`;
}

function getNodeVisualScore(data) {
  return data.ai?.semanticScore ?? data.globalScore ?? 0;
}

function getEdgeVisualScore(edge, aiAnalysis) {
  return aiAnalysis?.edges?.[edgeKey(edge)]?.semanticLocalScore ?? edge.localScore ?? 0;
}

function getEdgeVisualScoreSource(edge, aiAnalysis) {
  return aiAnalysis?.edges?.[edgeKey(edge)]?.semanticLocalScore != null ? 'ai' : 'formal';
}

function normalizeEdgeScoresByParent(edges) {
  const parentGroups = new Map();

  for (const edge of edges) {
    const group = parentGroups.get(edge.to) || [];
    group.push(edge);
    parentGroups.set(edge.to, group);
  }

  const normalizedScores = new Map();

  for (const group of parentGroups.values()) {
    const scores = group.map(edge => edge.rawVisualScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const hasRange = group.length > 1 && max !== min;

    for (const edge of group) {
      normalizedScores.set(edge.key, hasRange ? (edge.rawVisualScore - min) / (max - min) : 0.5);
    }
  }

  return normalizedScores;
}

function clamp01(value = 0) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`;
}

function mixColor(from, to, amount) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

function interpolateColor(score, stops) {
  const value = clamp01(score);
  for (let i = 1; i < stops.length; i += 1) {
    const previous = stops[i - 1];
    const next = stops[i];
    if (value <= next.score) {
      const range = next.score - previous.score || 1;
      return mixColor(previous.color, next.color, (value - previous.score) / range);
    }
  }
  return stops.at(-1).color;
}

const NODE_BACKGROUND_STOPS = [
  { score: 0, color: '#eff6ff' },
  { score: 0.35, color: '#dbeafe' },
  { score: 0.62, color: '#93c5fd' },
  { score: 1, color: '#1d4ed8' },
];

const NODE_BORDER_STOPS = [
  { score: 0, color: '#bfdbfe' },
  { score: 0.35, color: '#93c5fd' },
  { score: 0.62, color: '#3b82f6' },
  { score: 1, color: '#1e3a8a' },
];

function getNodeTone(score = 0) {
  const value = clamp01(score);
  const background = interpolateColor(value, NODE_BACKGROUND_STOPS);
  const border = interpolateColor(value, NODE_BORDER_STOPS);
  const isDark = value >= 0.78;

  return {
    background,
    border,
    text: isDark ? '#ffffff' : '#1e3a8a',
    badgeBackground: isDark ? 'rgba(255, 255, 255, 0.16)' : '#ffffff',
    badgeBorder: isDark ? 'rgba(255, 255, 255, 0.4)' : border,
    badgeText: isDark ? '#ffffff' : '#1e3a8a',
    handle: border,
  };
}

function DebateNode({ data }) {
  const score = getNodeVisualScore(data);
  const tone = getNodeTone(score);
  const hasAiScore = data.ai?.semanticScore != null;
  const selectedRing = data.selected ? '0 0 0 3px rgba(37, 99, 235, 0.25)' : '0 8px 18px rgba(15, 23, 42, 0.12)';
  const aiMismatch = data.ai?.formalDelta != null && Math.abs(data.ai.formalDelta) >= AI_MISMATCH_THRESHOLD;
  const title = hasAiScore
    ? `AI semantic CR: ${data.ai.semanticScore} formal global CR: ${data.globalScore} local CR: ${data.crScore}`
    : `formal global CR: ${data.globalScore} local CR: ${data.crScore}`;

  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        boxSizing: 'border-box',
        background: tone.background,
        color: tone.text,
        border: `2px solid ${tone.border}`,
        borderRadius: 6,
        boxShadow: selectedRing,
        padding: '10px 12px',
        display: 'grid',
        alignContent: 'start',
        gap: 7,
        cursor: 'pointer',
      }}
      title={title}
    >
      <Handle type="target" position={Position.Top} style={{ background: tone.handle }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color: tone.text,
          textTransform: 'uppercase',
          letterSpacing: 0,
        }}>
          {data.title}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: tone.badgeText,
          background: tone.badgeBackground,
          border: `1px solid ${tone.badgeBorder}`,
          borderRadius: 999,
          padding: '2px 7px',
          whiteSpace: 'nowrap',
        }}>
          {hasAiScore ? 'AI CR' : 'CR'} {score.toFixed(2)}
        </span>
      </div>
      {data.ai?.semanticScore != null && (
        <div style={{
          justifySelf: 'start',
          fontSize: 11,
          fontWeight: 800,
          color: aiMismatch ? '#4c1d95' : '#5b21b6',
          background: aiMismatch ? '#ddd6fe' : '#ede9fe',
          border: aiMismatch ? '2px solid #7c3aed' : '1px solid #c4b5fd',
          borderRadius: 999,
          padding: '2px 7px',
        }}>
          AI {data.ai.semanticScore.toFixed(2)}{aiMismatch ? ' mismatch' : ''}
        </div>
      )}
      <div style={{
        fontSize: 14,
        lineHeight: 1.35,
        fontWeight: 520,
        overflowWrap: 'anywhere',
      }}>
        {data.claimText}
      </div>
      {data.contextQuestion && (
        <div style={{
          fontSize: 11,
          lineHeight: 1.3,
          color: '#92400e',
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: 4,
          padding: '4px 6px',
        }}>
          {data.contextQuestion}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: tone.handle }} />
    </div>
  );
}

const nodeTypes = { debate: DebateNode };

function toReactFlowNodes(serverNodes, root, aiAnalysis, selectedNodeId) {
  return serverNodes.map((node) => ({
    id: node.id,
    type: 'debate',
    position: { x: 0, y: 0 },
    data: {
      ...node,
      isRoot: node.id === root,
      selected: node.id === selectedNodeId,
      ai: aiAnalysis?.nodes?.[node.title] ?? null,
    },
  }));
}

function toReactFlowEdges(serverEdges, aiAnalysis) {
  const scoredEdges = serverEdges.map((edge) => ({
    ...edge,
    key: edgeKey(edge),
    rawVisualScore: getEdgeVisualScore(edge, aiAnalysis),
    visualScoreSource: getEdgeVisualScoreSource(edge, aiAnalysis),
  }));
  const normalizedScores = normalizeEdgeScoresByParent(scoredEdges);

  return scoredEdges.map((edge, index) => {
    const color = relationColor(edge.type);
    const normalizedVisualScore = normalizedScores.get(edge.key) ?? 0.5;
    return {
      id: `e-${index}`,
      // Server edges are child -> parent. The display reads parent -> child.
      source: edge.to,
      target: edge.from,
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: crToStroke(normalizedVisualScore),
        strokeLinecap: 'round',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 10,
        height: 10,
        markerUnits: 'userSpaceOnUse',
        strokeWidth: 1.5,
      },
      data: {
        ...edge,
        visualScore: normalizedVisualScore,
        rawVisualScore: edge.rawVisualScore,
        normalizedVisualScore,
        visualScoreSource: edge.visualScoreSource,
      },
    };
  });
}

export default function DebateGraph({ graphData, aiAnalysis = null, selectedNodeId, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!graphData) return;
    const rfNodes = toReactFlowNodes(graphData.nodes, graphData.root, aiAnalysis, selectedNodeId);
    const rfEdges = toReactFlowEdges(graphData.edges, aiAnalysis);
    setNodes(applyDagreLayout(rfNodes, rfEdges));
    setEdges(rfEdges);
  }, [aiAnalysis, graphData, selectedNodeId, setEdges, setNodes]);

  if (!graphData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
        Parse Argdown to view the debate map.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={(_, node) => onNodeSelect?.(node.id)}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.1, minZoom: 0.5, maxZoom: 1 }}
      minZoom={0.5}
      maxZoom={1.4}
    >
      <Background color="#e5e7eb" />
      <Controls />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => getNodeTone(getNodeVisualScore(node.data || {})).background}
        nodeStrokeColor={(node) => getNodeTone(getNodeVisualScore(node.data || {})).border}
      />
    </ReactFlow>
  );
}
