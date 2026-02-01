# Light Visualizer – Implementation Plan

## Overview

A minimal web app prototype: organisational graph visualizer with in-memory data, a simple API, and interactive front-end. No database, no auth, no analytics.

---

## Architecture

```
project/
├── server/
│   ├── data.js          # Hardcoded graph (nodes + relationships)
│   └── server.js        # Express API serving graph slices
├── client/
│   ├── index.html       # Single page with graph canvas + sidebar
│   ├── style.css        # Minimal readable styles
│   └── app.js           # Fetch data, render graph (SVG), handle clicks
├── package.json
└── PLAN.md
```

Three clear layers: **Data Model** → **API** → **UI**

---

## Steps

### 1. Data Model (`server/data.js`)
- Define ~18 nodes across 5 types: Branch, Team, Role, Artefact, Constraint
- Define relationships using 4 types: HAS_TEAM, HAS_ROLE, PRODUCES, GOVERNED_BY
- Export as plain JS object `{ nodes: [...], relationships: [...] }`
- Each node: `{ id, type, label, properties: {} }`
- Each relationship: `{ source, target, type }`

Demo graph chain:
```
Branch: "Event Strategy & Delivery"
  ├─ HAS_TEAM → Team: "Design & Production"
  │   ├─ HAS_ROLE → Role: "Assistant Designer"
  │   ├─ HAS_ROLE → Role: "Production Manager"
  │   └─ PRODUCES → Artefact: "Ballot Paper"
  ├─ HAS_TEAM → Team: "Logistics & Compliance"
  │   ├─ HAS_ROLE → Role: "Compliance Officer"
  │   ├─ HAS_ROLE → Role: "Logistics Coordinator"
  │   ├─ PRODUCES → Artefact: "Event Run Sheet"
  │   └─ PRODUCES → Artefact: "Compliance Report"
  └─ GOVERNED_BY → Constraint: "Electoral Act"
+ additional cross-links (e.g. roles governed by constraints, artefacts governed by constraints)
```

### 2. API (`server/server.js`)
- Express server on port 3000
- `GET /api/graph` → returns full graph JSON
- `GET /api/node/:id` → returns single node + its direct relationships
- Serve `client/` as static files
- CORS not needed (same origin)

### 3. Front-end (`client/`)

**index.html**
- Left: SVG container for graph
- Right: sidebar panel (hidden until node clicked)

**app.js**
- On load: fetch `/api/graph`, render all nodes + edges as SVG
- Node positions: simple force-directed layout using basic iterative simulation (~50 lines, no library)
- Nodes rendered as colored circles by type, with labels
- Edges rendered as lines
- Click node → highlight it, fetch `/api/node/:id`, populate sidebar with label, type, properties, connections

**style.css**
- Minimal: flex layout, monospace font, muted colors per node type, sidebar styling

### 4. Wire Up & Test
- `npm start` runs the server
- Open browser → graph visible, clickable, sidebar works

---

## Constraints
- No external graph libraries (keep it transparent)
- No database
- No build tools (plain JS, no bundler)
- All code commented for readability
