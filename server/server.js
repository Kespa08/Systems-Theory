// server.js — Express API for the Light Visualizer prototype.
// Serves the graph data and static front-end files.
// Two endpoints:
//   GET /api/graph       → full graph (nodes + relationships)
//   GET /api/node/:id    → single node + its direct relationships

const express = require("express");
const path = require("path");
const graph = require("./data");

const app = express();
const PORT = 3000;

// Serve the front-end from /client
app.use(express.static(path.join(__dirname, "..", "client")));

// Return the full graph
app.get("/api/graph", (req, res) => {
  res.json(graph);
});

// Return a single node and its direct relationships
app.get("/api/node/:id", (req, res) => {
  const node = graph.nodes.find((n) => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ error: "Node not found" });
  }

  // Find relationships where this node is source or target
  const relationships = graph.relationships.filter(
    (r) => r.source === node.id || r.target === node.id
  );

  // Collect the IDs of connected nodes
  const connectedIds = new Set();
  relationships.forEach((r) => {
    connectedIds.add(r.source);
    connectedIds.add(r.target);
  });
  connectedIds.delete(node.id);

  const connectedNodes = graph.nodes.filter((n) => connectedIds.has(n.id));

  res.json({ node, relationships, connectedNodes });
});

app.listen(PORT, () => {
  console.log(`Light Visualizer running at http://localhost:${PORT}`);
});
