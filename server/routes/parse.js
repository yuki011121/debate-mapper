const express = require('express');
const { parse } = require('../src/parser');

const router = express.Router();

// POST /api/parse
// Body: { text: string }
// Returns: { nodes, edges, root }
router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing required field: text (string)' });
  }
  try {
    const graph = parse(text);
    res.json(graph);
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

module.exports = router;
