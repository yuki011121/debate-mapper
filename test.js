const fs = require('fs');
const path = require('path');
const { parse } = require('./parser');

const files = [
  'examples/lying.argdown',
  'examples/nixon.argdown',
  'examples/chinese-room.argdown',
  'examples/abortion.argdown'
];

for (const file of files) {
  const input = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const result = parse(input);

  console.log(`\n=== ${file} ===`);
  console.log(`model=${result.model} root=${result.root} nodes=${result.nodes.length} edges=${result.edges.length}`);

  const hasStatementNode = result.nodes.some(node => node.kind !== 'argument');
  if (hasStatementNode) {
    throw new Error(`${file} returned a non-argument node`);
  }

  if (file.includes('lying')) {
    const thesis = result.nodes.find(node => node.id === 'Thesis');
    const arg1 = result.nodes.find(node => node.id === 'arg1');
    const thesisEdge = result.edges.find(edge => edge.from === 'arg1' && edge.to === 'Thesis');

    if (!thesis?.contextQuestion) throw new Error('Lying demo root question was not extracted');
    if (!arg1?.innerStructure?.premises?.length) throw new Error('Lying demo inner structure was not extracted');
    if (!thesisEdge?.localScore) throw new Error('Lying demo edge local CR was not computed');
  }

  result.nodes
    .slice()
    .sort((a, b) => (b.globalScore ?? 0) - (a.globalScore ?? 0))
    .slice(0, 5)
    .forEach(node => {
      console.log(`  ${node.title.padEnd(14)} global=${node.globalScore} rootCR=${node.crScore} depth=${node.depth} branch=${node.branching}`);
    });
}
