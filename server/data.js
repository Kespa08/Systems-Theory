// data.js — In-memory graph data for the Light Visualizer prototype.
// This replaces a database. In later stages, this will be swapped for Neo4j.
// Each node has: id, type, label, and an optional properties object.
// Each relationship has: source (node id), target (node id), and type.

const graph = {
  nodes: [
    { id: "b1", type: "Branch", label: "Event Strategy & Delivery", properties: { description: "Oversees end-to-end event planning and execution" } },
    { id: "t1", type: "Team", label: "Design & Production", properties: { description: "Handles visual design and physical production of materials" } },
    { id: "r1", type: "Role", label: "Assistant Designer", properties: { description: "Supports design output under the lead designer" } },
    { id: "a1", type: "Artefact", label: "Ballot Paper", properties: { description: "Official voting document produced for elections" } },
    { id: "c1", type: "Constraint", label: "Electoral Act", properties: { description: "Primary legislation governing electoral processes" } },
  ],

  relationships: [
    { source: "b1", target: "t1", type: "HAS_TEAM" },
    { source: "t1", target: "r1", type: "HAS_ROLE" },
    { source: "t1", target: "a1", type: "PRODUCES" },
    { source: "a1", target: "c1", type: "GOVERNED_BY" },
  ],
};

module.exports = graph;
