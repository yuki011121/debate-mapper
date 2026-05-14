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
  return 1.2 + Math.pow(score, 1.6) * 10;
}

function crToNodeBorder(score = 0) {
  return 1.5 + Math.pow(score, 1.7) * 8;
}

function DebateNode({ data }) {
  const score = data.globalScore ?? 0;
  const borderWidth = crToNodeBorder(score);
  const selectedRing = data.selected ? '0 0 0 3px rgba(37, 99, 235, 0.25)' : '0 8px 18px rgba(15, 23, 42, 0.12)';
  const aiMismatch = data.ai?.formalDelta != null && Math.abs(data.ai.formalDelta) >= AI_MISMATCH_THRESHOLD;

  return (
    <div
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        boxSizing: 'border-box',
        background: '#ffffff',
        color: '#111827',
        border: `${borderWidth}px solid ${data.isRoot ? '#111827' : '#6b7280'}`,
        borderRadius: 6,
        boxShadow: selectedRing,
        padding: '10px 12px',
        display: 'grid',
        alignContent: 'start',
        gap: 7,
        cursor: 'pointer',
      }}
      title={`global CR: ${data.globalScore} local CR: ${data.crScore}`}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#6b7280' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 12,
          fontWeight: 800,
          color: data.isRoot ? '#111827' : '#374151',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {data.title}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#111827',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 999,
          padding: '2px 7px',
          whiteSpace: 'nowrap',
        }}>
          CR {score.toFixed(2)}
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
        fontWeight: 500 + Math.round(score * 300),
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
      <Handle type="source" position={Position.Bottom} style={{ background: '#6b7280' }} />
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

function toReactFlowEdges(serverEdges) {
  return serverEdges.map((edge, index) => {
    const color = relationColor(edge.type);
    return {
      id: `e-${index}`,
      // Server edges are child -> parent. The display reads parent -> child.
      source: edge.to,
      target: edge.from,
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: crToStroke(edge.localScore),
        strokeLinecap: 'round',
      },
      markerEnd: { type: MarkerType.ArrowClosed, color },
      data: edge,
    };
  });
}

export default function DebateGraph({ graphData, aiAnalysis = null, selectedNodeId, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!graphData) return;
    const rfNodes = toReactFlowNodes(graphData.nodes, graphData.root, aiAnalysis, selectedNodeId);
    const rfEdges = toReactFlowEdges(graphData.edges);
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
        nodeColor={(node) => (node.data?.isRoot ? '#111827' : '#ffffff')}
        nodeStrokeColor={() => '#6b7280'}
      />
    </ReactFlow>
  );
}
