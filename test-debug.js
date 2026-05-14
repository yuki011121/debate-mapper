const { ArgdownApplication, ParserPlugin, ModelPlugin } = require('@argdown/core');

const app = new ArgdownApplication();
app.addPlugin(new ParserPlugin(), 'parse');
app.addPlugin(new ModelPlugin(), 'build-model');

const nixonExample = `
[Root]: Nixon is an extremist.
  + <Hawk>: Nixon is a Hawk.
    + [Republican]: Nixon is a Republican.
    - [Quaker]: Nixon is a Quaker.
`;

const result = app.run({ process: ['parse', 'build-model'], input: nixonExample });

console.log('\n=== statements ===');
console.log(JSON.stringify(Object.keys(result.statements || {}), null, 2));

console.log('\n=== arguments ===');
console.log(JSON.stringify(Object.keys(result.arguments || {}), null, 2));

console.log('\n=== relations (first one) ===');
if (result.relations && result.relations.length > 0) {
  const rel = result.relations[0];
  console.log('Keys:', Object.keys(rel));
  console.log('from:', rel.from);
  console.log('to:', rel.to);
  console.log('relationType:', rel.relationType);
  console.log('occurrences:', rel.occurrences ? rel.occurrences.length + ' items' : 'none');
}

console.log('\n=== First statement structure ===');
const stmt = Object.values(result.statements || {})[0];
if (stmt) {
  console.log('Statement keys:', Object.keys(stmt));
  console.log('members:', stmt.members ? stmt.members.length : 'none');
  console.log('relations:', stmt.relations ? stmt.relations.length : 'none');
}

console.log('\n=== First argument structure ===');
const arg = Object.values(result.arguments || {})[0];
if (arg) {
  console.log('Argument keys:', Object.keys(arg));
  console.log('pcs:', arg.pcs ? arg.pcs.length : 'none');
  console.log('members:', arg.members ? arg.members.length : 'none');
  console.log('relations:', arg.relations ? arg.relations.length : 'none');
}
