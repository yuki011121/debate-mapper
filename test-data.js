const { ArgdownApplication, ParserPlugin, ModelPlugin } = require('@argdown/core');

const app = new ArgdownApplication();
app.addPlugin(new ParserPlugin(), 'parse');
app.addPlugin(new ModelPlugin(), 'build-model');

// Try using frontmatter or data syntax
const argdownWithData = `
---
author: Test Author
date: 2026-04-30
---

[Root]: Main claim.
  + <Arg1>: Supporting argument.
`;

const result = app.run({ process: ['parse', 'build-model'], input: argdownWithData });

console.log('\n=== Response keys ===');
console.log(Object.keys(result));

console.log('\n=== Request properties (metadata) ===');
console.log('title:', result.title);
console.log('author:', result.author);
console.log('date:', result.date);

console.log('\n=== First statement data field ===');
const stmt = Object.values(result.statements || {})[0];
if (stmt) {
  console.log('data:', stmt.data);
}
