/* ============================================================
   editor.js — the drag-and-drop SVG canvas engine.
   Owns workflow state, rendering, and all pointer interactions.
   Exposes window.Editor for the rest of the app.
   ============================================================ */
(function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const NODE_W = window.NODE_W, NODE_H = window.NODE_H;

  // ---- Shared state ----
  const state = {
    name: "Untitled workflow",
    nodes: [],          // { id, type, name, x, y, config:{} }
    edges: [],          // { id, from, to }
    selected: null,     // { kind:'node'|'edge', id }
    view: { x: 60, y: 60, zoom: 1 }
  };

  let svg, viewport, gNodes, gEdges, tempEdge;
  let onChange = () => {};          // app hooks autosave/counts here
  let onSelect = () => {};          // app/panel hooks selection here
  let seq = 1;

  const drag = { mode: null };      // 'node' | 'pan' | 'connect'

  // ---- Helpers ----
  function uid(prefix) { return prefix + "_" + (Date.now().toString(36)) + "_" + (seq++); }

  function el(tag, attrs) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function clientToWorld(cx, cy) {
    const r = svg.getBoundingClientRect();
    return {
      x: (cx - r.left - state.view.x) / state.view.zoom,
      y: (cy - r.top - state.view.y) / state.view.zoom
    };
  }

  function getNode(id) { return state.nodes.find(n => n.id === id); }
  function outPort(n) { return { x: n.x + NODE_W, y: n.y + NODE_H / 2 }; }
  function inPort(n) { return { x: n.x, y: n.y + NODE_H / 2 }; }

  function edgePath(a, b) {
    const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }

  // ---- View / transform ----
  function applyView() {
    viewport.setAttribute("transform",
      `translate(${state.view.x} ${state.view.y}) scale(${state.view.zoom})`);
    const lbl = document.getElementById("zoomLabel");
    if (lbl) lbl.textContent = Math.round(state.view.zoom * 100) + "%";
  }

  function zoomAt(cx, cy, factor) {
    const before = clientToWorld(cx, cy);
    let z = state.view.zoom * factor;
    z = Math.min(2.5, Math.max(0.25, z));
    state.view.zoom = z;
    const r = svg.getBoundingClientRect();
    state.view.x = (cx - r.left) - before.x * z;
    state.view.y = (cy - r.top) - before.y * z;
    applyView();
  }

  // ---- Rendering ----
  function render() {
    gEdges.innerHTML = "";
    gNodes.innerHTML = "";
    tempEdge = el("path", { id: "tempEdge", fill: "none", stroke: "#4ade80",
      "stroke-width": 2.5, "stroke-dasharray": "6 4", "pointer-events": "none" });
    gEdges.appendChild(tempEdge);

    state.edges.forEach(renderEdge);
    state.nodes.forEach(renderNode);
    applySelectionStyles();
    document.getElementById("emptyHint").hidden = state.nodes.length > 0;
    onChange();
  }

  function renderEdge(edge) {
    const a = getNode(edge.from), b = getNode(edge.to);
    if (!a || !b) return;
    const hit = el("path", { class: "edge-hit", d: edgePath(outPort(a), inPort(b)),
      fill: "none", stroke: "transparent", "stroke-width": 14, cursor: "pointer" });
    const line = el("path", { class: "edge-line", d: edgePath(outPort(a), inPort(b)),
      fill: "none", stroke: "#4ade80", "stroke-width": 2.5 });
    hit.dataset.edge = edge.id;
    line.dataset.edge = edge.id;
    gEdges.appendChild(hit);
    gEdges.appendChild(line);
  }

  function refreshEdgesFor(nodeId) {
    state.edges.forEach(e => {
      if (e.from === nodeId || e.to === nodeId) {
        const a = getNode(e.from), b = getNode(e.to);
        if (!a || !b) return;
        const d = edgePath(outPort(a), inPort(b));
        gEdges.querySelectorAll(`[data-edge="${e.id}"]`).forEach(p => p.setAttribute("d", d));
      }
    });
  }

  function renderNode(node) {
    const t = NODE_TYPES[node.type];
    const g = el("g", { class: "node", transform: `translate(${node.x} ${node.y})` });
    g.dataset.id = node.id;

    g.appendChild(el("rect", { class: "node-rect", x: 0, y: 0, width: NODE_W, height: NODE_H,
      rx: 12, fill: "#262636", stroke: t.color, "stroke-width": 1.5 }));
    // left accent bar
    g.appendChild(el("rect", { x: 0, y: 0, width: 5, height: NODE_H, rx: 2, fill: t.color,
      "pointer-events": "none" }));
    // icon
    const icon = el("text", { x: 20, y: NODE_H / 2 + 7, "font-size": 22, "pointer-events": "none" });
    icon.textContent = t.icon;
    g.appendChild(icon);
    // title
    const title = el("text", { class: "n-title", x: 48, y: 27, "font-size": 14,
      "font-family": "Segoe UI, Arial, sans-serif", "font-weight": 600, fill: "#e6e6f0",
      "pointer-events": "none" });
    title.textContent = clip(node.name || t.label, 20);
    g.appendChild(title);
    // subtitle (primary config or type label)
    const sub = el("text", { class: "n-sub", x: 48, y: 46, "font-size": 11.5,
      "font-family": "Segoe UI, Arial, sans-serif", fill: "#9a9ab0", "pointer-events": "none" });
    sub.textContent = clip(subtitleFor(node), 24);
    g.appendChild(sub);

    // input port (left)
    g.appendChild(el("circle", { class: "port-in-vis", cx: 0, cy: NODE_H / 2, r: 5,
      fill: "#1a1a24", stroke: t.color, "stroke-width": 2, "pointer-events": "none" }));
    const inHit = el("circle", { class: "port-hit", cx: 0, cy: NODE_H / 2, r: 11, fill: "transparent" });
    inHit.dataset.portIn = node.id;
    g.appendChild(inHit);

    // output port (right)
    g.appendChild(el("circle", { class: "port-out-vis", cx: NODE_W, cy: NODE_H / 2, r: 5,
      fill: t.color, stroke: "#1a1a24", "stroke-width": 1.5, "pointer-events": "none" }));
    const outHit = el("circle", { class: "port-hit", cx: NODE_W, cy: NODE_H / 2, r: 11, fill: "transparent" });
    outHit.dataset.portOut = node.id;
    g.appendChild(outHit);

    gNodes.appendChild(g);
  }

  function subtitleFor(node) {
    const t = NODE_TYPES[node.type];
    const c = node.config || {};
    const primary = c.triggerType || c.sourceType || c.actionType || c.outputType || c.model;
    return primary ? `${t.label} · ${primary}` : t.label;
  }

  function clip(s, max) { s = String(s || ""); return s.length > max ? s.slice(0, max - 1) + "…" : s; }

  function updateNodeVisual(node) {
    const g = gNodes.querySelector(`.node[data-id="${node.id}"]`);
    if (!g) return;
    g.querySelector(".n-title").textContent = clip(node.name || NODE_TYPES[node.type].label, 20);
    g.querySelector(".n-sub").textContent = clip(subtitleFor(node), 24);
  }

  function applySelectionStyles() {
    gNodes.querySelectorAll(".node-rect").forEach(r => r.setAttribute("stroke-width", 1.5));
    gEdges.querySelectorAll(".edge-line").forEach(l => { l.setAttribute("stroke", "#4ade80"); l.setAttribute("stroke-width", 2.5); });
    if (!state.selected) return;
    if (state.selected.kind === "node") {
      const g = gNodes.querySelector(`.node[data-id="${state.selected.id}"] .node-rect`);
      if (g) g.setAttribute("stroke-width", 3);
    } else if (state.selected.kind === "edge") {
      const l = gEdges.querySelector(`.edge-line[data-edge="${state.selected.id}"]`);
      if (l) { l.setAttribute("stroke", "#ff6d5a"); l.setAttribute("stroke-width", 3.5); }
    }
  }

  function select(kind, id) {
    state.selected = id ? { kind, id } : null;
    applySelectionStyles();
    onSelect(state.selected);
  }

  // ---- Node / edge mutations ----
  function addNode(type, x, y) {
    const t = NODE_TYPES[type];
    const node = { id: uid("node"), type, name: t.label,
      x: Math.round(x), y: Math.round(y), config: Object.assign({}, t.defaults) };
    state.nodes.push(node);
    renderNode(node);
    document.getElementById("emptyHint").hidden = true;
    select("node", node.id);
    onChange();
    return node;
  }

  function addEdge(from, to) {
    if (from === to) return;
    if (state.edges.some(e => e.from === from && e.to === to)) return;
    const edge = { id: uid("edge"), from, to };
    state.edges.push(edge);
    renderEdge(edge);
    onChange();
  }

  function deleteSelected() {
    if (!state.selected) return;
    if (state.selected.kind === "node") {
      const id = state.selected.id;
      state.nodes = state.nodes.filter(n => n.id !== id);
      state.edges = state.edges.filter(e => e.from !== id && e.to !== id);
    } else {
      state.edges = state.edges.filter(e => e.id !== state.selected.id);
    }
    state.selected = null;
    render();
    onSelect(null);
  }

  // ---- Pointer interactions ----
  function onPointerDown(e) {
    if (e.button === 2) return;        // let the context-menu handler deal with right-click
    e.preventDefault();                // stop the browser from starting a text selection
    const portOut = e.target.dataset && e.target.dataset.portOut;
    const portIn = e.target.dataset && e.target.dataset.portIn;
    const nodeG = e.target.closest && e.target.closest(".node");
    const edgeEl = e.target.dataset && e.target.dataset.edge;

    if (portOut) {
      drag.mode = "connect";
      drag.from = portOut;
      svg.classList.add("connecting");
      const p = clientToWorld(e.clientX, e.clientY);
      tempEdge.setAttribute("d", edgePath(outPort(getNode(portOut)), p));
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (portIn && !nodeG) return; // ignore stray
    if (nodeG) {
      const id = nodeG.dataset.id;
      select("node", id);
      const node = getNode(id);
      const w = clientToWorld(e.clientX, e.clientY);
      drag.mode = "node";
      drag.id = id;
      drag.dx = w.x - node.x;
      drag.dy = w.y - node.y;
      svg.setPointerCapture(e.pointerId);
      return;
    }
    if (edgeEl) { select("edge", edgeEl); return; }

    // empty space → pan + clear selection
    select(null, null);
    drag.mode = "pan";
    drag.sx = e.clientX; drag.sy = e.clientY;
    drag.vx = state.view.x; drag.vy = state.view.y;
    svg.classList.add("panning");
    svg.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (!drag.mode) return;
    if (drag.mode === "node") {
      const w = clientToWorld(e.clientX, e.clientY);
      const node = getNode(drag.id);
      node.x = Math.round(w.x - drag.dx);
      node.y = Math.round(w.y - drag.dy);
      const g = gNodes.querySelector(`.node[data-id="${node.id}"]`);
      g.setAttribute("transform", `translate(${node.x} ${node.y})`);
      refreshEdgesFor(node.id);
    } else if (drag.mode === "pan") {
      state.view.x = drag.vx + (e.clientX - drag.sx);
      state.view.y = drag.vy + (e.clientY - drag.sy);
      applyView();
    } else if (drag.mode === "connect") {
      const p = clientToWorld(e.clientX, e.clientY);
      tempEdge.setAttribute("d", edgePath(outPort(getNode(drag.from)), p));
    }
  }

  function onPointerUp(e) {
    if (drag.mode === "connect") {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const toId = target && target.dataset && target.dataset.portIn;
      if (toId) addEdge(drag.from, toId);
      tempEdge.setAttribute("d", "");
      svg.classList.remove("connecting");
    }
    if (drag.mode === "node") onChange();
    svg.classList.remove("panning");
    drag.mode = null;
  }

  // ---- Fit to view ----
  function fit() {
    if (!state.nodes.length) { state.view = { x: 60, y: 60, zoom: 1 }; applyView(); return; }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.nodes.forEach(n => {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + NODE_W); maxY = Math.max(maxY, n.y + NODE_H);
    });
    const pad = 60;
    const r = svg.getBoundingClientRect();
    const zw = r.width / (maxX - minX + pad * 2);
    const zh = r.height / (maxY - minY + pad * 2);
    let z = Math.min(zw, zh, 1.4);
    z = Math.max(0.25, z);
    state.view.zoom = z;
    state.view.x = (r.width - (maxX - minX) * z) / 2 - minX * z;
    state.view.y = (r.height - (maxY - minY) * z) / 2 - minY * z;
    applyView();
  }

  // ---- Public API ----
  window.Editor = {
    state,
    init(opts) {
      svg = document.getElementById("canvas");
      viewport = document.getElementById("viewport");
      gNodes = document.getElementById("nodes");
      gEdges = document.getElementById("edges");
      onChange = opts.onChange || onChange;
      onSelect = opts.onSelect || onSelect;

      svg.addEventListener("pointerdown", onPointerDown);
      svg.addEventListener("pointermove", onPointerMove);
      svg.addEventListener("pointerup", onPointerUp);
      svg.addEventListener("pointercancel", onPointerUp);
      svg.addEventListener("contextmenu", (e) => e.preventDefault());
      svg.addEventListener("wheel", (e) => {
        e.preventDefault();
        zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 0.89);
      }, { passive: false });

      // palette drag-drop
      svg.addEventListener("dragover", (e) => e.preventDefault());
      svg.addEventListener("drop", (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("text/node-type");
        if (!type || !NODE_TYPES[type]) return;
        const w = clientToWorld(e.clientX, e.clientY);
        addNode(type, w.x - NODE_W / 2, w.y - NODE_H / 2);
      });

      applyView();
      render();
    },
    addNode,
    addNodeCenter(type) {
      const r = svg.getBoundingClientRect();
      const w = clientToWorld(r.left + r.width / 2, r.top + r.height / 2);
      return addNode(type, w.x - NODE_W / 2, w.y - NODE_H / 2);
    },
    deleteSelected,
    select,
    getSelectedNode() {
      return state.selected && state.selected.kind === "node" ? getNode(state.selected.id) : null;
    },
    updateNodeVisual,
    render,
    fit,
    zoomBy(f) {
      const r = svg.getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, f);
    },
    serialize() {
      return { version: 1, name: state.name,
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        edges: JSON.parse(JSON.stringify(state.edges)) };
    },
    load(data) {
      state.name = data.name || "Untitled workflow";
      state.nodes = (data.nodes || []).map(n => ({ ...n, config: n.config || {} }));
      state.edges = data.edges || [];
      state.selected = null;
      render();
      onSelect(null);
      fit();
    },
    clear() {
      state.name = "Untitled workflow";
      state.nodes = []; state.edges = []; state.selected = null;
      state.view = { x: 60, y: 60, zoom: 1 };
      applyView(); render(); onSelect(null);
    },
    getSvgEl() { return svg; },
    bounds() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      state.nodes.forEach(n => {
        minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x + NODE_W); maxY = Math.max(maxY, n.y + NODE_H);
      });
      return { minX, minY, maxX, maxY };
    }
  };
})();
