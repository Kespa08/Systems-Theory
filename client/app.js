// app.js — Front-end logic for the Light Visualizer prototype.
// Renders an embedded graph as SVG, handles click interaction.
// Uses a simple force-directed layout (no external libraries).
// Works standalone (file://) or served via Express.

(function () {
  const svg = document.getElementById("graph");
  const sidebar = document.getElementById("sidebar");

  // --- Embedded graph data (same as server/data.js) ---
  // This lets the app work when opened directly as a file.
  const graph = {
    nodes: [
      { id: "b1", type: "Branch", label: "Event Strategy & Delivery", properties: { description: "Oversees end-to-end event planning and execution" } },
      { id: "t1", type: "Team", label: "Design & Production", properties: { description: "Handles visual design and physical production of materials" } },
      { id: "t2", type: "Team", label: "Logistics & Compliance", properties: { description: "Manages event logistics and regulatory compliance" } },
      { id: "t3", type: "Team", label: "Stakeholder Engagement", properties: { description: "Coordinates communication with internal and external stakeholders" } },
      { id: "r1", type: "Role", label: "Assistant Designer", properties: { description: "Supports design output under the lead designer" } },
      { id: "r2", type: "Role", label: "Production Manager", properties: { description: "Oversees production timelines and quality" } },
      { id: "r3", type: "Role", label: "Compliance Officer", properties: { description: "Ensures all outputs meet regulatory requirements" } },
      { id: "r4", type: "Role", label: "Logistics Coordinator", properties: { description: "Plans and executes event logistics" } },
      { id: "r5", type: "Role", label: "Engagement Lead", properties: { description: "Drives stakeholder communication strategy" } },
      { id: "r6", type: "Role", label: "Communications Officer", properties: { description: "Handles public-facing messaging and media" } },
      { id: "a1", type: "Artefact", label: "Ballot Paper", properties: { description: "Official voting document produced for elections" } },
      { id: "a2", type: "Artefact", label: "Event Run Sheet", properties: { description: "Step-by-step schedule for event execution" } },
      { id: "a3", type: "Artefact", label: "Compliance Report", properties: { description: "Document certifying regulatory adherence" } },
      { id: "a4", type: "Artefact", label: "Stakeholder Brief", properties: { description: "Summary document for stakeholder communication" } },
      { id: "c1", type: "Constraint", label: "Electoral Act", properties: { description: "Primary legislation governing electoral processes" } },
      { id: "c2", type: "Constraint", label: "Privacy Regulation", properties: { description: "Data handling and privacy requirements" } },
    ],
    relationships: [
      { source: "b1", target: "t1", type: "HAS_TEAM" },
      { source: "b1", target: "t2", type: "HAS_TEAM" },
      { source: "b1", target: "t3", type: "HAS_TEAM" },
      { source: "t1", target: "r1", type: "HAS_ROLE" },
      { source: "t1", target: "r2", type: "HAS_ROLE" },
      { source: "t2", target: "r3", type: "HAS_ROLE" },
      { source: "t2", target: "r4", type: "HAS_ROLE" },
      { source: "t3", target: "r5", type: "HAS_ROLE" },
      { source: "t3", target: "r6", type: "HAS_ROLE" },
      { source: "t1", target: "a1", type: "PRODUCES" },
      { source: "t2", target: "a2", type: "PRODUCES" },
      { source: "t2", target: "a3", type: "PRODUCES" },
      { source: "t3", target: "a4", type: "PRODUCES" },
      { source: "a1", target: "c1", type: "GOVERNED_BY" },
      { source: "a3", target: "c1", type: "GOVERNED_BY" },
      { source: "r3", target: "c1", type: "GOVERNED_BY" },
      { source: "a4", target: "c2", type: "GOVERNED_BY" },
      { source: "r6", target: "c2", type: "GOVERNED_BY" },
    ],
  };

  // --- Layout: simple force simulation ---
  // Assign initial random positions and zero velocity to each node.
  const width = () => svg.clientWidth;
  const height = () => svg.clientHeight;

  const nodeMap = {};
  graph.nodes.forEach((n) => {
    n.x = Math.random() * (width() - 100) + 50;
    n.y = Math.random() * (height() - 100) + 50;
    n.vx = 0;
    n.vy = 0;
    nodeMap[n.id] = n;
  });

  // Radius by type
  const radius = (type) => {
    const sizes = { Branch: 22, Team: 16, Role: 10, Artefact: 12, Constraint: 14 };
    return sizes[type] || 10;
  };

  // Run a basic force simulation for a fixed number of iterations.
  // Forces: repulsion between all nodes, attraction along edges, centering.
  function simulate(iterations) {
    for (let i = 0; i < iterations; i++) {
      const alpha = 1 - i / iterations; // cooling

      // Repulsion (all pairs)
      for (let a = 0; a < graph.nodes.length; a++) {
        for (let b = a + 1; b < graph.nodes.length; b++) {
          const na = graph.nodes[a];
          const nb = graph.nodes[b];
          let dx = na.x - nb.x;
          let dy = na.y - nb.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          let force = (800 / (dist * dist)) * alpha;
          na.vx += (dx / dist) * force;
          na.vy += (dy / dist) * force;
          nb.vx -= (dx / dist) * force;
          nb.vy -= (dy / dist) * force;
        }
      }

      // Attraction (edges)
      graph.relationships.forEach((r) => {
        const s = nodeMap[r.source];
        const t = nodeMap[r.target];
        if (!s || !t) return;
        let dx = t.x - s.x;
        let dy = t.y - s.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let force = (dist - 120) * 0.005 * alpha;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      });

      // Center gravity
      const cx = width() / 2;
      const cy = height() / 2;
      graph.nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.001 * alpha;
        n.vy += (cy - n.y) * 0.001 * alpha;
      });

      // Apply velocity + damping
      graph.nodes.forEach((n) => {
        n.vx *= 0.6;
        n.vy *= 0.6;
        n.x += n.vx;
        n.y += n.vy;
        // Keep within bounds
        const r = radius(n.type);
        n.x = Math.max(r, Math.min(width() - r, n.x));
        n.y = Math.max(r, Math.min(height() - r, n.y));
      });
    }
  }

  simulate(300);

  // --- Render SVG ---
  const NS = "http://www.w3.org/2000/svg";

  // Draw edges first (so they sit behind nodes)
  graph.relationships.forEach((r) => {
    const s = nodeMap[r.source];
    const t = nodeMap[r.target];
    if (!s || !t) return;
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", s.x);
    line.setAttribute("y1", s.y);
    line.setAttribute("x2", t.x);
    line.setAttribute("y2", t.y);
    line.setAttribute("class", "edge");
    svg.appendChild(line);
  });

  // Draw nodes
  let selectedCircle = null;

  graph.nodes.forEach((n) => {
    const r = radius(n.type);

    // Circle
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", r);
    circle.setAttribute("class", `node-circle node-${n.type}`);
    circle.addEventListener("click", () => selectNode(n, circle));
    svg.appendChild(circle);

    // Label
    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", n.x);
    text.setAttribute("y", n.y + r + 14);
    text.setAttribute("class", "node-label");
    text.textContent = n.label;
    svg.appendChild(text);
  });

  // --- Click handler: select node and populate sidebar ---
  // Uses the embedded data directly — no API call needed.
  function selectNode(node, circle) {
    // Deselect previous
    if (selectedCircle) selectedCircle.classList.remove("selected");
    selectedCircle = circle;
    circle.classList.add("selected");

    // Find relationships involving this node
    const rels = graph.relationships.filter(
      (r) => r.source === node.id || r.target === node.id
    );

    // Build sidebar HTML
    let html = `<h2>${node.label}</h2>`;
    html += `<div class="node-type">${node.type}</div>`;

    if (node.properties && node.properties.description) {
      html += `<div class="section-label">Description</div>`;
      html += `<div class="description">${node.properties.description}</div>`;
    }

    if (rels.length > 0) {
      html += `<div class="section-label">Connections</div><ul>`;
      rels.forEach((r) => {
        const otherId = r.source === node.id ? r.target : r.source;
        const other = nodeMap[otherId];
        if (!other) return;
        const arrow = r.source === node.id ? "→" : "←";
        html += `<li><span class="rel-type">${r.type}</span> ${arrow} ${other.label}</li>`;
      });
      html += `</ul>`;
    }

    sidebar.innerHTML = html;
  }
})();
