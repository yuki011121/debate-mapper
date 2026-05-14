/**
 * debate-mapper/src/parser.js
 *
 * Wraps the Argdown parser and attaches CR scores to the graph.
 */

const { ArgdownApplication, ParserPlugin, ModelPlugin } = require('@argdown/core');
const { buildGraph, scoreGraph, edgeKey } = require('./cr-score');

const app = new ArgdownApplication();
app.addPlugin(new ParserPlugin(), 'parse');
app.addPlugin(new ModelPlugin(), 'build-model');

/**
 * Parse an Argdown string and return an argument-centric debate graph
 * enriched with CR scores.
 *
 * Returns:
 * {
 *   nodes: [ { id, title, claimText, innerStructure, contextQuestion, crScore, globalScore } ],
 *   edges: [ { from, to, type, localScore } ], // from child argument -> to parent argument
 *   root: string
 * }
 */
function extractContextQuestions(argdownText) {
  const questions = {};
  const blockPattern = /\/\*\s*@question\s+([^:]+):\s*([\s\S]*?)\*\//g;
  const linePattern = /^\s*\/\/\s*@question\s+([^:]+):\s*(.+)$/gm;

  for (const match of argdownText.matchAll(blockPattern)) {
    questions[match[1].trim()] = match[2].replace(/\s+/g, ' ').trim();
  }
  for (const match of argdownText.matchAll(linePattern)) {
    questions[match[1].trim()] = match[2].trim();
  }

  return questions;
}

function parse(argdownText) {
  const result = app.run({ process: ['parse', 'build-model'], input: argdownText });

  if (result.parserErrors?.length) {
    throw new Error('Argdown parse error: ' + result.parserErrors[0].message);
  }

  const graph = buildGraph(result, { contextQuestions: extractContextQuestions(argdownText) });
  const { root, nodeScores, edgeScores } = scoreGraph(graph);

  const nodes = [...graph.nodes.values()].map(n => ({
    id: n.title,
    title: n.title,
    label: n.label,
    kind: n.kind,
    claimText: n.claimText,
    tags: n.tags,
    contextQuestion: n.contextQuestion,
    innerStructure: n.innerStructure,
    ...(nodeScores.get(n.title) || {})
  }));

  const edges = graph.edges.map(edge => ({
    ...edge,
    localScore: edgeScores.get(edgeKey(edge)) ?? 0
  }));

  return {
    model: 'argument-centric',
    nodes,
    edges,
    root
  };
}

module.exports = { parse, extractContextQuestions };
