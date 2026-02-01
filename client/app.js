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
      { id: "b2", type: "Sub-Branch", label: "Program Delivery", properties: { description: "Focuses on the creative and aesthetic aspects of events" } },
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

  // Uniform radius for all node types
  const radius = () => 6;

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
        const r = radius();
        n.x = Math.max(r, Math.min(width() - r, n.x));
        n.y = Math.max(r, Math.min(height() - r, n.y));
      });
    }
  }

  simulate(300);

  // --- Render SVG ---
  const NS = "http://www.w3.org/2000/svg";

  // Map from node id → connected edge elements (with role: source or target)
  const edgesByNode = {};
  graph.nodes.forEach((n) => { edgesByNode[n.id] = []; });

  // Map from node id → its SVG circle and label elements
  const elemsByNode = {};

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
    edgesByNode[r.source].push({ line, role: "source" });
    edgesByNode[r.target].push({ line, role: "target" });
  });

  // Draw nodes
  let selectedNode = null;
  let selectedCircle = null;

  graph.nodes.forEach((n) => {
    const r = radius();

    // Circle
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", n.x);
    circle.setAttribute("cy", n.y);
    circle.setAttribute("r", r);
    circle.setAttribute("class", `node-circle node-${n.type}`);

    // Hover: highlight connected edges (only when not selected)
    circle.addEventListener("mouseenter", () => {
      if (selectedNode !== n) {
        edgesByNode[n.id].forEach((e) => e.line.classList.add("highlighted"));
      }
    });
    circle.addEventListener("mouseleave", () => {
      if (selectedNode !== n) {
        edgesByNode[n.id].forEach((e) => e.line.classList.remove("highlighted"));
      }
    });

    svg.appendChild(circle);

    // Label background + text
    const labelBg = document.createElementNS(NS, "rect");
    labelBg.setAttribute("class", "node-label-bg");
    svg.appendChild(labelBg);

    const text = document.createElementNS(NS, "text");
    text.setAttribute("x", n.x);
    text.setAttribute("y", n.y + r + 17);
    text.setAttribute("class", "node-label");
    text.textContent = n.label;
    svg.appendChild(text);

    // Size the background rect to fit the text
    requestAnimationFrame(() => {
      const bbox = text.getBBox();
      labelBg.setAttribute("x", bbox.x - 3);
      labelBg.setAttribute("y", bbox.y - 3);
      labelBg.setAttribute("width", bbox.width + 9);
      labelBg.setAttribute("height", bbox.height + 6);
    });

    elemsByNode[n.id] = { circle, text, labelBg };

    // --- Drag behaviour ---
    let dragging = false;
    let dragMoved = false;

    circle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      dragging = true;
      dragMoved = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      dragMoved = true;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
      n.x = svgPt.x;
      n.y = svgPt.y;
      updateNodePosition(n);
      repelNearbyNodes(n);
    });

    window.addEventListener("mouseup", () => {
      if (dragging && !dragMoved) {
        selectNode(n, circle);
      }
      dragging = false;
    });
  });

  // --- Drag repulsion ---
  const REPULSE_RADIUS = 36;

  function repelNearbyNodes(draggedNode) {
    graph.nodes.forEach((other) => {
      if (other === draggedNode) return;
      let dx = other.x - draggedNode.x;
      let dy = other.y - draggedNode.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
      if (dist < REPULSE_RADIUS) {
        let push = (REPULSE_RADIUS - dist) / REPULSE_RADIUS;
        let nx = dx / dist;
        let ny = dy / dist;
        other.vx += nx * push * REPULSE_RADIUS;
        other.vy += ny * push * REPULSE_RADIUS;
      }
    });
  }

  // --- Momentum animation loop ---
  const FRICTION = 0.92;
  const MIN_VELOCITY = 0.1;

  function animateNodes() {
    graph.nodes.forEach((node) => {
      if (Math.abs(node.vx) < MIN_VELOCITY && Math.abs(node.vy) < MIN_VELOCITY) return;
      node.vx *= FRICTION;
      node.vy *= FRICTION;
      node.x += node.vx;
      node.y += node.vy;
      // Keep within bounds
      const r = radius();
      node.x = Math.max(r, Math.min(width() - r, node.x));
      node.y = Math.max(r, Math.min(height() - r, node.y));
      updateNodePosition(node);
    });
    requestAnimationFrame(animateNodes);
  }
  requestAnimationFrame(animateNodes);

  // Update a node's circle, label, and connected edges
  function updateNodePosition(node) {
    const r = radius();
    const elems = elemsByNode[node.id];
    elems.circle.setAttribute("cx", node.x);
    elems.circle.setAttribute("cy", node.y);
    elems.text.setAttribute("x", node.x);
    elems.text.setAttribute("y", node.y + r + 17);

    // Update label background position
    const bbox = elems.text.getBBox();
    elems.labelBg.setAttribute("x", bbox.x - 3);
    elems.labelBg.setAttribute("y", bbox.y - 3);
    elems.labelBg.setAttribute("width", bbox.width + 9);
    elems.labelBg.setAttribute("height", bbox.height + 6);

    edgesByNode[node.id].forEach((e) => {
      if (e.role === "source") {
        e.line.setAttribute("x1", node.x);
        e.line.setAttribute("y1", node.y);
      } else {
        e.line.setAttribute("x2", node.x);
        e.line.setAttribute("y2", node.y);
      }
    });
  }

  // Clear all selection state
  function deselectNode() {
    if (selectedNode) {
      edgesByNode[selectedNode.id].forEach((e) => e.line.classList.remove("highlighted"));
      elemsByNode[selectedNode.id].text.classList.remove("selected");
      // Remove related class from connected nodes
      graph.relationships.forEach((r) => {
        if (r.source === selectedNode.id || r.target === selectedNode.id) {
          const otherId = r.source === selectedNode.id ? r.target : r.source;
          if (elemsByNode[otherId]) elemsByNode[otherId].circle.classList.remove("related");
        }
      });
      // Remove active from overview entry
      const prev = document.querySelector('.overview-entry.active');
      if (prev) prev.classList.remove("active");
    }
    if (selectedCircle) selectedCircle.classList.remove("selected");
    selectedNode = null;
    selectedCircle = null;
    sidebar.innerHTML = '<p class="placeholder">Click a node to view details</p>';
  }

  // --- Click handler: select node and populate sidebar ---
  function selectNode(node, circle) {
    // If clicking the already-selected node, deselect
    if (selectedNode === node) {
      deselectNode();
      return;
    }

    // Clear previous selection
    deselectNode();

    selectedNode = node;
    selectedCircle = circle;
    circle.classList.add("selected");
    elemsByNode[node.id].text.classList.add("selected");

    // Persistently highlight connected edges and related nodes
    edgesByNode[node.id].forEach((e) => e.line.classList.add("highlighted"));
    graph.relationships.forEach((r) => {
      if (r.source === node.id || r.target === node.id) {
        const otherId = r.source === node.id ? r.target : r.source;
        if (elemsByNode[otherId]) elemsByNode[otherId].circle.classList.add("related");
      }
    });

    // Highlight matching overview entry
    const entries = document.querySelectorAll('.overview-entry');
    entries.forEach((entry) => {
      entry.classList.toggle("active", entry.dataset.nodeId === node.id);
    });

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

  // --- Overview panel ---
  const overviewEl = document.getElementById("overview");
  const overviewToggle = document.getElementById("overview-toggle");
  const overviewList = document.getElementById("overview-list");

  // Populate list
  let listHTML = "";
  graph.nodes.forEach((n) => {
    const desc = (n.properties && n.properties.description) || "";
    listHTML += `<div class="overview-entry" data-node-id="${n.id}">`;
    listHTML += `<div class="overview-entry__label">${n.label}</div>`;
    listHTML += `<div class="overview-entry__type">${n.type}</div>`;
    if (desc) listHTML += `<div class="overview-entry__desc">${desc}</div>`;
    listHTML += `</div>`;
  });
  overviewList.innerHTML = listHTML;

  // Toggle open/close
  overviewToggle.addEventListener("click", () => {
    overviewEl.classList.toggle("open");
  });

  // Click an entry to select that node on the graph
  overviewList.addEventListener("click", (e) => {
    const entry = e.target.closest(".overview-entry");
    if (!entry) return;
    const id = entry.dataset.nodeId;
    const node = nodeMap[id];
    const elems = elemsByNode[id];
    if (node && elems) selectNode(node, elems.circle);
  });

  // --- Add Node form ---
  const addNodeBtn = document.getElementById("add-node-btn");
  const addNodeForm = document.getElementById("add-node-form");
  const addRelBtn = document.getElementById("add-rel-btn");
  const relList = document.getElementById("relationships-list");
  const createNodeBtn = document.getElementById("create-node-btn");

  const relTypes = ["HAS_TEAM", "HAS_ROLE", "PRODUCES", "GOVERNED_BY"];

  // Build target node options HTML
  function nodeOptionsHTML() {
    return graph.nodes.map((n) =>
      `<option value="${n.id}">${n.label} (${n.type})</option>`
    ).join("");
  }

  // Add a relationship row
  function addRelRow() {
    const row = document.createElement("div");
    row.className = "relationship-row";
    row.innerHTML =
      `<div class="rel-row-header"><button type="button" class="buttons rel-remove-btn">x</button></div>` +
      `<select class="rel-type-select">` +
      relTypes.map((t) => `<option value="${t}">${t}</option>`).join("") +
      `</select>` +
      `<select class="rel-target-select">${nodeOptionsHTML()}</select>`;
    row.querySelector(".rel-remove-btn").addEventListener("click", () => row.remove());
    relList.appendChild(row);
  }

  // Toggle form
  addNodeBtn.addEventListener("click", () => {
    addNodeForm.classList.toggle("open");
    addNodeBtn.style.display = addNodeForm.classList.contains("open") ? "none" : "";
  });

  // Close form
  document.getElementById("close-form-btn").addEventListener("click", () => {
    addNodeForm.classList.remove("open");
    addNodeBtn.style.display = "";
  });

  // Add relationship row
  addRelBtn.addEventListener("click", () => addRelRow());

  // Create: build prompt and display in sidebar
  createNodeBtn.addEventListener("click", () => {
    const type = document.getElementById("node-type").value;
    const label = document.getElementById("node-label").value.trim();
    const desc = document.getElementById("node-desc").value.trim();

    if (!label) return;

    // Gather relationships
    const rows = relList.querySelectorAll(".relationship-row");
    const rels = [];
    rows.forEach((row) => {
      const relType = row.querySelector(".rel-type-select").value;
      const targetId = row.querySelector(".rel-target-select").value;
      const targetNode = nodeMap[targetId];
      rels.push({ relType, targetId, targetLabel: targetNode ? targetNode.label : targetId });
    });

    // Build prompt
    let prompt = `Add the following node to data.js and app.js:\n\n`;
    prompt += `Node: { type: "${type}", label: "${label}"`;
    if (desc) prompt += `, properties: { description: "${desc}" }`;
    prompt += ` }\n`;

    if (rels.length > 0) {
      prompt += `\nRelationships:\n`;
      rels.forEach((r) => {
        prompt += `- ${r.relType} → ${r.targetLabel} (${r.targetId})\n`;
      });
    }

    sidebar.innerHTML = `<div class="section-label">Prompt — copy and paste</div><div class="prompt-output">${prompt}</div>`;

    // Close form
    addNodeForm.classList.remove("open");
    addNodeBtn.style.display = "";
  });
})();
