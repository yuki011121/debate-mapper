const express = require('express');
const { AzureOpenAI } = require('openai');
const { parse } = require('../src/parser');

const router = express.Router();

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
});

const ANALYSIS_VERSION = 'semantic-cr-v1';
const MISMATCH_THRESHOLD = 0.25;

function clampScore(value) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

function roundDelta(value) {
  return Math.round(value * 100) / 100;
}

function edgeKey(edge) {
  return `${edge.from}=>${edge.to}:${edge.type}`;
}

function asShortText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.replace(/\s+/g, ' ').trim().slice(0, 280);
}

function validateAnalysis(raw, graph) {
  const validNodeTitles = new Set(graph.nodes.map(node => node.title));
  const validEdgeKeys = new Set(graph.edges.map(edgeKey));
  const nodes = {};
  const edges = {};
  const disagreements = [];

  for (const node of graph.nodes) {
    const rawNode = raw?.nodes?.[node.title];
    const semanticScore = clampScore(rawNode?.semanticScore);
    if (semanticScore == null) continue;

    const formalDelta = roundDelta(semanticScore - (node.globalScore ?? 0));
    nodes[node.title] = {
      semanticScore,
      role: asShortText(rawNode?.role, 'semantic assessment'),
      rationale: asShortText(rawNode?.rationale),
      formalDelta
    };

    if (Math.abs(formalDelta) >= MISMATCH_THRESHOLD) {
      disagreements.push({
        target: node.title,
        kind: 'node',
        formalScore: node.globalScore ?? 0,
        semanticScore,
        reason: asShortText(rawNode?.rationale, 'AI semantic score differs from formal CR.')
      });
    }
  }

  for (const edge of graph.edges) {
    const key = edgeKey(edge);
    const rawEdge = raw?.edges?.[key];
    const semanticLocalScore = clampScore(rawEdge?.semanticLocalScore);
    if (semanticLocalScore == null) continue;

    edges[key] = {
      semanticLocalScore,
      rationale: asShortText(rawEdge?.rationale)
    };

    const formalDelta = roundDelta(semanticLocalScore - (edge.localScore ?? 0));
    if (Math.abs(formalDelta) >= MISMATCH_THRESHOLD) {
      disagreements.push({
        target: key,
        kind: 'edge',
        formalScore: edge.localScore ?? 0,
        semanticScore: semanticLocalScore,
        reason: asShortText(rawEdge?.rationale, 'AI semantic local score differs from formal local CR.')
      });
    }
  }

  for (const item of raw?.disagreements || []) {
    const kind = item?.kind === 'edge' ? 'edge' : 'node';
    const target = asShortText(item?.target);
    const validTarget = kind === 'node' ? validNodeTitles.has(target) : validEdgeKeys.has(target);
    if (!validTarget) continue;

    const formalScore = clampScore(item?.formalScore);
    const semanticScore = clampScore(item?.semanticScore);
    disagreements.push({
      target,
      kind,
      formalScore: formalScore ?? 0,
      semanticScore: semanticScore ?? 0,
      reason: asShortText(item?.reason, 'AI identified a formal/semantic relevance mismatch.')
    });
  }

  const dedupedDisagreements = [];
  const seenDisagreements = new Set();
  for (const item of disagreements) {
    const key = `${item.kind}:${item.target}`;
    if (seenDisagreements.has(key)) continue;
    seenDisagreements.add(key);
    dedupedDisagreements.push(item);
  }

  return {
    analysisVersion: ANALYSIS_VERSION,
    nodes,
    edges,
    disagreements: dedupedDisagreements
  };
}

function buildAnalysisPayload(graph) {
  return {
    root: graph.root,
    nodes: graph.nodes.map(node => ({
      title: node.title,
      claimText: node.claimText,
      contextQuestion: node.contextQuestion,
      globalScore: node.globalScore,
      rootCrScore: node.crScore,
      contexts: node.contexts,
      innerStructure: {
        description: node.innerStructure?.description,
        premises: node.innerStructure?.premises?.map(item => item.text) || [],
        conclusions: node.innerStructure?.conclusions?.map(item => item.text) || []
      }
    })),
    edges: graph.edges.map(edge => ({
      key: edgeKey(edge),
      from: edge.from,
      to: edge.to,
      type: edge.type,
      localScore: edge.localScore
    }))
  };
}

const SYSTEM_PROMPT = `You are an expert argumentation analyst. You will receive a structured debate map generated from Argdown.

Your job is semantic Context Relevance analysis, not formal graph scoring. Do not imitate depth, height, branching, siblings, or leaf status. Formal CR scores are included only so you can identify meaningful disagreements between structural relevance and semantic relevance.

For each argument node, rate semanticScore from 0.0 to 1.0 based on meaning: whether the argument directly bears on the root thesis, whether it is a key objection or reply, whether it could change how the debate is resolved, whether it is merely an example, repetition, side issue, or narrow sub-debate. Include a short role and rationale.

For each edge, rate semanticLocalScore from 0.0 to 1.0 based on how important the child argument is to understanding or resolving the immediate parent/context relation. Include a short rationale.

Return ONLY raw JSON with this exact shape:
{
  "nodes": {
    "ArgumentTitle": { "semanticScore": 0.0, "role": "short role", "rationale": "short reason" }
  },
  "edges": {
    "from=>to:type": { "semanticLocalScore": 0.0, "rationale": "short reason" }
  },
  "disagreements": [
    { "target": "ArgumentTitle or from=>to:type", "kind": "node", "formalScore": 0.0, "semanticScore": 0.0, "reason": "short reason" }
  ]
}

Use only node titles and edge keys present in the payload. No markdown fences, no prose outside JSON.`;

router.post('/', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    let graph;
    try {
      graph = parse(text);
    } catch (err) {
      return res.status(422).json({ error: err.message });
    }

    const payload = buildAnalysisPayload(graph);
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
      max_tokens: 3000,
      temperature: 0,
    });

    const rawContent = response.choices[0]?.message?.content ?? '{}';
    const jsonText = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let rawAnalysis;
    try {
      rawAnalysis = JSON.parse(jsonText);
    } catch {
      return res.status(422).json({ error: 'LLM returned invalid JSON', raw: rawContent });
    }

    res.json(validateAnalysis(rawAnalysis, graph));
  } catch (err) {
    const status = err.status ?? 500;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
