# Debate Mapper

A text-first prototype for debate mapping with **Context Relevance (CR)** scoring. The project extends Argdown rather than replacing it: the `.argdown` text remains the real interface, while the graph is a generated view for classroom analysis.

## Theory Alignment

This prototype follows Ava Wright's grant/PPT direction:

- Debate-map nodes are **arguments**, represented by their conclusions, not bare claims.
- Edges are **support** or **dispute** relations between arguments.
- Support appears in combined/hybrid maps when it helps expose the position behind a dispute.
- Argument diagramming is kept separate from debate mapping: premises and conclusions live inside each argument's internal structure.
- If a premise becomes disputed, it should be broken out as its own argument node.
- Context questions are metadata for a subtree/context, not primary debate nodes.

The older mixed `statement`/`argument` graph has been replaced by an argument-centric graph.

## What This Does

- Parses Argdown text into a debate-level graph of argument nodes only.
- Reads Argdown premise-conclusion structures (PCS) as internal node metadata.
- Computes formal CR scores from PPT-style features: local depth, height, branching/in-degree, outdegree, leaf status, and siblings.
- Aggregates local CR scores across predecessor contexts into a global CR score.
- Displays local CR as edge thickness and global CR as node weight.
- Uses the "Lying is sometimes permissible" map as the canonical demo.

## Argdown Pattern

Define each argument with optional internal structure:

```argdown
<arg1>: White lies are obviously ok.

(1) Some white lies protect feelings without serious harm.
----
(2) Some white lies are permissible.
```

Then define the debate map with argument references:

```argdown
<Thesis>
  + <arg1>
    - <carg1>
```

Context questions can be attached with comments:

```argdown
/* @question Thesis: Is lying always wrong? */
```

Tags must stay at the end of a definition, for example:

```argdown
<arg1>: White lies are obviously ok. #example
```

## Project Structure

```text
debate-mapper/
├── examples/
│   ├── lying.argdown
│   ├── nixon.argdown
│   ├── chinese-room.argdown
│   └── abortion.argdown
├── server/
│   ├── src/parser.js
│   ├── src/cr-score.js
│   └── routes/
└── client/
    └── src/
        ├── App.jsx
        └── components/
```

## Quick Start

```bash
cd server && npm run dev
cd client && npm run dev
```

Open `http://localhost:5173`.

## Verification

```bash
node test.js
cd client && npm run build
```

## Next Research Steps

- Add semantic CR features from the PPT: extensions, overlapping paths, support/dispute status inside extensions.
- Refine LLM-assisted scoring so it rates arguments in local contexts, not only globally.
- Compare CR scores against expert ratings on a curated standard debate.
