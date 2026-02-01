// data.js — In-memory graph data for the Light Visualizer prototype.
// This replaces a database. In later stages, this will be swapped for Neo4j.
// Each node has: id, type, label, and an optional properties object.
// Each relationship has: source (node id), target (node id), and type.

const graph = {
  nodes: [
    // Branches
    { id: "b1", type: "Branch", label: "Event Strategy & Delivery", properties: { description: "Oversees end-to-end event planning and execution" } },

    // Teams
    { id: "t1", type: "Team", label: "Design & Production", properties: { description: "Handles visual design and physical production of materials" } },
    { id: "t2", type: "Team", label: "Logistics & Compliance", properties: { description: "Manages event logistics and regulatory compliance" } },
    { id: "t3", type: "Team", label: "Stakeholder Engagement", properties: { description: "Coordinates communication with internal and external stakeholders" } },

    // Roles
    { id: "r1", type: "Role", label: "Assistant Designer", properties: { description: "Supports design output under the lead designer" } },
    { id: "r2", type: "Role", label: "Production Manager", properties: { description: "Oversees production timelines and quality" } },
    { id: "r3", type: "Role", label: "Compliance Officer", properties: { description: "Ensures all outputs meet regulatory requirements" } },
    { id: "r4", type: "Role", label: "Logistics Coordinator", properties: { description: "Plans and executes event logistics" } },
    { id: "r5", type: "Role", label: "Engagement Lead", properties: { description: "Drives stakeholder communication strategy" } },
    { id: "r6", type: "Role", label: "Communications Officer", properties: { description: "Handles public-facing messaging and media" } },

    // Artefacts
    { id: "a1", type: "Artefact", label: "Ballot Paper", properties: { description: "Official voting document produced for elections" } },
    { id: "a2", type: "Artefact", label: "Event Run Sheet", properties: { description: "Step-by-step schedule for event execution" } },
    { id: "a3", type: "Artefact", label: "Compliance Report", properties: { description: "Document certifying regulatory adherence" } },
    { id: "a4", type: "Artefact", label: "Stakeholder Brief", properties: { description: "Summary document for stakeholder communication" } },

    // Constraints
    { id: "c1", type: "Constraint", label: "Electoral Act", properties: { description: "Primary legislation governing electoral processes" } },
    { id: "c2", type: "Constraint", label: "Privacy Regulation", properties: { description: "Data handling and privacy requirements" } },
  ],

  relationships: [
    // Branch → Teams
    { source: "b1", target: "t1", type: "HAS_TEAM" },
    { source: "b1", target: "t2", type: "HAS_TEAM" },
    { source: "b1", target: "t3", type: "HAS_TEAM" },

    // Teams → Roles
    { source: "t1", target: "r1", type: "HAS_ROLE" },
    { source: "t1", target: "r2", type: "HAS_ROLE" },
    { source: "t2", target: "r3", type: "HAS_ROLE" },
    { source: "t2", target: "r4", type: "HAS_ROLE" },
    { source: "t3", target: "r5", type: "HAS_ROLE" },
    { source: "t3", target: "r6", type: "HAS_ROLE" },

    // Teams → Artefacts
    { source: "t1", target: "a1", type: "PRODUCES" },
    { source: "t2", target: "a2", type: "PRODUCES" },
    { source: "t2", target: "a3", type: "PRODUCES" },
    { source: "t3", target: "a4", type: "PRODUCES" },

    // Constraints govern various nodes
    { source: "a1", target: "c1", type: "GOVERNED_BY" },
    { source: "a3", target: "c1", type: "GOVERNED_BY" },
    { source: "r3", target: "c1", type: "GOVERNED_BY" },
    { source: "a4", target: "c2", type: "GOVERNED_BY" },
    { source: "r6", target: "c2", type: "GOVERNED_BY" },
  ],
};

module.exports = graph;
