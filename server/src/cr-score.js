/**
 * Argument-centric debate graph + Context Relevance (CR) scoring.
 *
 * The public graph is a debate map: argument nodes represented by their
 * conclusions, connected by support/dispute edges. Argdown statements used
 * inside premise-conclusion structures stay inside node metadata.
 */

const DISPUTE_TYPES = new Set(['attack', 'contrary', 'contradictory', 'undercut']);

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function cleanInlineTags(text = '') {
  return String(text)
    .replace(/#\([^)]+\)/g, '')
    .replace(/#[a-zA-Z0-9-\u00A0-\uFFFF]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getArgumentDescription(argument) {
  const member = argument.members?.find(m => cleanInlineTags(m.text || '').length > 0);
  return cleanInlineTags(member?.text || '');
}

function getMainConclusion(argument) {
  return argument.pcs?.find(s => s.role === 'main-conclusion') || argument.pcs?.at(-1);
}

function getClaimText(title, argument) {
  const conclusion = getMainConclusion(argument);
  return cleanInlineTags(conclusion?.text || getArgumentDescription(argument) || title);
}

function getInnerStructure(argument) {
  const steps = (argument.pcs || []).map((step, index) => ({
    number: index + 1,
    title: step.title,
    role: step.role,
    text: cleanInlineTags(step.text || ''),
    inferenceRules: step.inference?.inferenceRules || []
  }));

  return {
    description: getArgumentDescription(argument),
    premises: steps.filter(step => step.role === 'premise'),
    conclusions: steps.filter(step => step.role && step.role.includes('conclusion')),
    steps
  };
}

function normalizeRelationType(relationType) {
  return DISPUTE_TYPES.has(relationType) ? 'dispute' : 'support';
}

function resolveRelationMember(member, argdownResult) {
  if (!member?.title) return [];

  if (argdownResult.arguments?.[member.title]) {
    return [member.title];
  }

  const statement = argdownResult.statements?.[member.title] || member;
  const argumentTitles = new Set();

  for (const statementMember of statement.members || []) {
    if (statementMember.argumentTitle && argdownResult.arguments?.[statementMember.argumentTitle]) {
      argumentTitles.add(statementMember.argumentTitle);
    }
  }

  return [...argumentTitles];
}

function edgeKey(edge) {
  return `${edge.from}=>${edge.to}:${edge.type}`;
}

function buildGraphIndexes(graph) {
  const children = new Map();
  const parents = new Map();

  for (const title of graph.nodes.keys()) {
    children.set(title, []);
    parents.set(title, []);
  }

  for (const edge of graph.edges) {
    if (!children.has(edge.to)) children.set(edge.to, []);
    if (!parents.has(edge.from)) parents.set(edge.from, []);
    children.get(edge.to).push(edge.from);
    parents.get(edge.from).push(edge.to);
  }

  return { children, parents };
}

function buildGraph(argdownResult, metadata = {}) {
  const nodes = new Map();
  const edges = [];
  const seenEdges = new Set();
  const contextQuestions = metadata.contextQuestions || {};

  for (const [title, argument] of Object.entries(argdownResult.arguments || {})) {
    const claimText = getClaimText(title, argument);
    nodes.set(title, {
      id: title,
      title,
      label: title,
      kind: 'argument',
      claimText,
      tags: argument.tags || [],
      contextQuestion: contextQuestions[title] || null,
      innerStructure: getInnerStructure(argument)
    });
  }

  for (const relation of argdownResult.relations || []) {
    const fromTitles = resolveRelationMember(relation.from, argdownResult);
    const toTitles = resolveRelationMember(relation.to, argdownResult);
    const type = normalizeRelationType(relation.relationType);

    for (const from of fromTitles) {
      for (const to of toTitles) {
        if (!nodes.has(from) || !nodes.has(to) || from === to) continue;
        const edge = { from, to, type };
        const key = edgeKey(edge);
        if (seenEdges.has(key)) continue;
        seenEdges.add(key);
        edges.push(edge);
      }
    }
  }

  return { nodes, edges };
}

function findRoot(graph) {
  const hasParent = new Set(graph.edges.map(edge => edge.from));
  for (const title of graph.nodes.keys()) {
    if (!hasParent.has(title)) return title;
  }
  return graph.nodes.keys().next().value;
}

function computeCR(graph, contextRoot) {
  const { children, parents } = buildGraphIndexes(graph);
  const depth = new Map();
  const queue = [contextRoot];
  depth.set(contextRoot, 0);

  while (queue.length) {
    const node = queue.shift();
    for (const child of children.get(node) || []) {
      if (!depth.has(child)) {
        depth.set(child, depth.get(node) + 1);
        queue.push(child);
      }
    }
  }

  const height = new Map();
  function getHeight(node, path = new Set()) {
    if (height.has(node)) return height.get(node);
    if (path.has(node)) return 0;
    path.add(node);
    const kids = (children.get(node) || []).filter(child => depth.has(child));
    const value = kids.length === 0 ? 0 : 1 + Math.max(...kids.map(child => getHeight(child, new Set(path))));
    height.set(node, value);
    return value;
  }
  for (const node of depth.keys()) getHeight(node);

  const branchDegree = new Map();
  const outDegree = new Map();
  const siblingCount = new Map();

  for (const node of depth.keys()) {
    const visibleChildren = (children.get(node) || []).filter(child => depth.has(child));
    const visibleParents = (parents.get(node) || []).filter(parent => depth.has(parent));
    branchDegree.set(node, visibleChildren.length);
    outDegree.set(node, visibleParents.length);

    let siblings = 0;
    for (const parent of visibleParents) {
      siblings += (children.get(parent) || []).filter(child => depth.has(child) && child !== node).length;
    }
    siblingCount.set(node, siblings);
  }

  const maxDepth = Math.max(1, ...depth.values());
  const maxHeight = Math.max(1, ...height.values());
  const maxBranchDegree = Math.max(1, ...branchDegree.values());
  const maxOutDegree = Math.max(1, ...outDegree.values());
  const scores = new Map();

  for (const node of depth.keys()) {
    const d = depth.get(node);
    const h = height.get(node) || 0;
    const branching = branchDegree.get(node) || 0;
    const outgoing = outDegree.get(node) || 0;
    const siblings = siblingCount.get(node) || 0;
    const isLeaf = branching === 0;

    const features = {
      depth: 1 - d / maxDepth,
      height: h / maxHeight,
      branching: branching / maxBranchDegree,
      outDegree: outgoing / maxOutDegree,
      siblings: 1 / (siblings + 1),
      leaf: isLeaf ? 1 : 0
    };

    const score =
      features.depth * 0.30 +
      features.height * 0.22 +
      features.branching * 0.18 +
      features.outDegree * 0.10 +
      features.siblings * 0.10 +
      features.leaf * 0.10;

    scores.set(node, {
      contextRoot,
      depth: d,
      height: h,
      inDegree: branching,
      branching,
      outDegree: outgoing,
      siblings,
      isLeaf,
      crScore: roundScore(score),
      features: Object.fromEntries(Object.entries(features).map(([key, value]) => [key, roundScore(value)]))
    });
  }

  return scores;
}

function getAncestors(node, parents, root) {
  if (node === root) return [root];

  const ancestors = new Set();
  const queue = [...(parents.get(node) || [])];

  while (queue.length) {
    const parent = queue.shift();
    if (ancestors.has(parent)) continue;
    ancestors.add(parent);
    for (const next of parents.get(parent) || []) queue.push(next);
  }

  if (!ancestors.size && root) ancestors.add(root);
  return [...ancestors];
}

function geometricMean(values) {
  if (!values.length) return 0;
  return Math.exp(values.reduce((sum, value) => sum + Math.log(value + 0.001), 0) / values.length);
}

function scoreGraph(graph) {
  const root = findRoot(graph);
  const { parents } = buildGraphIndexes(graph);
  const contextCache = new Map();

  function scoresForContext(contextRoot) {
    if (!contextCache.has(contextRoot)) {
      contextCache.set(contextRoot, computeCR(graph, contextRoot));
    }
    return contextCache.get(contextRoot);
  }

  const rootScores = scoresForContext(root);
  const nodeScores = new Map();
  const edgeScores = new Map();

  for (const title of graph.nodes.keys()) {
    const contexts = getAncestors(title, parents, root);
    const contextScores = contexts
      .map(contextRoot => scoresForContext(contextRoot).get(title))
      .filter(Boolean);
    const crValues = contextScores.map(score => score.crScore);
    const globalScore = roundScore(geometricMean(crValues));

    nodeScores.set(title, {
      ...(rootScores.get(title) || {}),
      globalScore,
      contexts: contextScores.map(score => ({
        contextRoot: score.contextRoot,
        crScore: score.crScore,
        depth: score.depth,
        height: score.height,
        branching: score.branching,
        outDegree: score.outDegree,
        siblings: score.siblings,
        isLeaf: score.isLeaf
      }))
    });
  }

  for (const edge of graph.edges) {
    const local = scoresForContext(edge.to).get(edge.from);
    edgeScores.set(edgeKey(edge), local?.crScore ?? 0);
  }

  return { root, nodeScores, edgeScores };
}

function globalRelevance(graph) {
  return scoreGraph(graph).nodeScores;
}

module.exports = {
  buildGraph,
  findRoot,
  computeCR,
  globalRelevance,
  scoreGraph,
  edgeKey
};
