# Debate Mapper

Debate Mapper is a text-first prototype for building argument maps from Argdown and visualizing Context Relevance (CR). The text remains the source of truth; the graph is a generated classroom view for comparing formal structure with AI-assisted semantic relevance.

## Overview

- Parses Argdown into an argument-level debate map.
- Keeps premises and conclusions inside each argument node as internal structure.
- Shows support and dispute relations between arguments.
- Computes formal CR from graph structure as the default score.
- Uses AI semantic CR for node and edge visual weights after clicking **Analyze with AI**.

## How It Works

The server parses Argdown and returns nodes, edges, and formal CR scores. Before AI analysis, the graph uses formal CR as a fallback: node color shows global CR, and edge thickness shows local CR.

When AI analysis runs, `/api/llm-score` asks the model for semantic CR. The graph then uses:

- `nodes[title].semanticScore` for node weight.
- `edges["from=>to:type"].semanticLocalScore` for edge weight.

The formal scores remain available for comparison and mismatch notes.

## Run Locally

Start the API server:

```bash
cd server
npm run dev
```

Start the Vite client:

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## AI Analysis Config

Create a `.env` file at the project root with OpenAI settings:

```env
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_API_VERSION=
AZURE_OPENAI_DEPLOYMENT_NAME=
```

Without these values, parsing still works, but **Analyze with AI** will fail.

## Verification

```bash
cd client
npm run build
```

Optional parser smoke test:

```bash
node test.js
```
