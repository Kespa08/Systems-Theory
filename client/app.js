// app.js — Front-end logic for the Light Visualizer prototype.
// Fetches the graph from the API, renders it as SVG, handles click interaction.
// Uses a simple force-directed layout (no external libraries).

(async function () {
  const svg = document.getElementById("graph");
  const sidebar = document.getElementById("sidebar");

  // --- Fetch graph data ---
  const res = await fetch("/api/graph");
  const graph = await res.json();

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
  async function selectNode(node, circle) {
    // Deselect previous
    if (selectedCircle) selectedCircle.classList.remove("selected");
    selectedCircle = circle;
    circle.classList.add("selected");

    // Fetch node detail from API
    const res = await fetch(`/api/node/${node.id}`);
    const data = await res.json();

    // Build sidebar HTML
    let html = `<h2>${data.node.label}</h2>`;
    html += `<div class="node-type">${data.node.type}</div>`;

    if (data.node.properties && data.node.properties.description) {
      html += `<div class="section-label">Description</div>`;
      html += `<div class="description">${data.node.properties.description}</div>`;
    }

    if (data.relationships.length > 0) {
      html += `<div class="section-label">Connections</div><ul>`;
      data.relationships.forEach((r) => {
        // Determine the "other" node
        const otherId = r.source === node.id ? r.target : r.source;
        const other = data.connectedNodes.find((n) => n.id === otherId);
        if (!other) return;

        // Show direction
        const arrow = r.source === node.id ? "→" : "←";
        html += `<li><span class="rel-type">${r.type}</span> ${arrow} ${other.label}</li>`;
      });
      html += `</ul>`;
    }

    sidebar.innerHTML = html;
  }
})();
