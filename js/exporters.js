/* ============================================================
   exporters.js — turns the workflow into deliverables:
     • JSON  (machine-readable definition)
     • PNG   (diagram image, rasterized from the live SVG)
     • Doc   (ordered Markdown requirements for developers)
   ============================================================ */
(function () {
  function safeName(s) {
    return (s || "workflow").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-").toLowerCase() || "workflow";
  }

  function download(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // ---------- JSON ----------
  function exportJson() {
    const data = window.Editor.serialize();
    download(safeName(data.name) + ".json", JSON.stringify(data, null, 2), "application/json");
  }

  // ---------- PNG ----------
  function exportPng() {
    const st = window.Editor.state;
    if (!st.nodes.length) { window.App.status("Add some nodes first — nothing to export yet."); return; }

    const b = window.Editor.bounds();
    const pad = 50;
    const w = (b.maxX - b.minX) + pad * 2;
    const h = (b.maxY - b.minY) + pad * 2;
    const scale = 2;

    // Build a standalone SVG using inline-styled clones (no external CSS needed).
    const svgNS = "http://www.w3.org/2000/svg";
    const out = document.createElementNS(svgNS, "svg");
    out.setAttribute("xmlns", svgNS);
    out.setAttribute("width", w);
    out.setAttribute("height", h);
    out.setAttribute("viewBox", `${b.minX - pad} ${b.minY - pad} ${w} ${h}`);

    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("x", b.minX - pad); bg.setAttribute("y", b.minY - pad);
    bg.setAttribute("width", w); bg.setAttribute("height", h);
    bg.setAttribute("fill", "#1a1a24");
    out.appendChild(bg);

    // edges + nodes carry world coords and inline styles already
    const edges = document.getElementById("edges").cloneNode(true);
    const temp = edges.querySelector("#tempEdge"); if (temp) temp.remove();
    edges.querySelectorAll(".edge-hit").forEach(e => e.remove());
    out.appendChild(edges);
    out.appendChild(document.getElementById("nodes").cloneNode(true));

    const xml = new XMLSerializer().serializeToString(out);
    const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        download(safeName(st.name) + ".png", blob, "image/png");
        window.App.status("Diagram exported as PNG.");
      }, "image/png");
    };
    img.onerror = function () { window.App.status("Sorry — the image export failed in this browser."); };
    img.src = svgUrl;
  }

  // ---------- Requirements doc (Markdown) ----------
  function orderedNodes() {
    const st = window.Editor.state;
    const incoming = {};
    st.nodes.forEach(n => incoming[n.id] = 0);
    st.edges.forEach(e => { if (incoming[e.to] != null) incoming[e.to]++; });

    // Start from nodes with no incoming edge (triggers / entry points), left-to-right.
    const starts = st.nodes.filter(n => incoming[n.id] === 0).sort((a, b) => a.x - b.x);
    const visited = new Set();
    const order = [];
    const queue = starts.length ? starts.slice() : st.nodes.slice().sort((a, b) => a.x - b.x);

    while (queue.length) {
      const n = queue.shift();
      if (!n || visited.has(n.id)) continue;
      visited.add(n.id);
      order.push(n);
      const next = st.edges
        .filter(e => e.from === n.id)
        .map(e => st.nodes.find(x => x.id === e.to))
        .filter(Boolean)
        .sort((a, b) => a.x - b.x);
      next.forEach(nn => { if (!visited.has(nn.id)) queue.push(nn); });
    }
    // append any disconnected nodes
    st.nodes.slice().sort((a, b) => a.x - b.x).forEach(n => { if (!visited.has(n.id)) order.push(n); });
    return order;
  }

  function exportDoc() {
    const st = window.Editor.state;
    if (!st.nodes.length) { window.App.status("Add some nodes first — nothing to document yet."); return; }

    const order = orderedNodes();
    const idToNum = {};
    order.forEach((n, i) => idToNum[n.id] = i + 1);
    const date = new Date().toISOString().slice(0, 10);

    const L = [];
    L.push(`# ${st.name || "Untitled workflow"}`);
    L.push("");
    L.push(`**Copilot Agent — Workflow Requirements**`);
    L.push("");
    L.push(`_Generated ${date} with the Copilot Agent Workflow Designer._`);
    L.push("");
    L.push("---");
    L.push("");

    // Overview
    L.push("## Overview");
    L.push("");
    const counts = {};
    st.nodes.forEach(n => counts[n.type] = (counts[n.type] || 0) + 1);
    L.push(`- **Steps:** ${st.nodes.length}`);
    L.push(`- **Connections:** ${st.edges.length}`);
    const breakdown = window.NODE_ORDER.filter(t => counts[t]).map(t => `${counts[t]} × ${NODE_TYPES[t].label}`).join(", ");
    if (breakdown) L.push(`- **Building blocks:** ${breakdown}`);
    L.push("");

    // Flow at a glance
    L.push("## Flow at a glance");
    L.push("");
    L.push("```");
    L.push(order.map(n => n.name || NODE_TYPES[n.type].label).join("  →  "));
    L.push("```");
    L.push("");

    // Step detail
    L.push("## Step-by-step requirements");
    L.push("");
    order.forEach((n, i) => {
      const t = NODE_TYPES[n.type];
      L.push(`### ${i + 1}. ${n.name || t.label}  _(${t.label})_`);
      L.push("");
      L.push(`**Purpose:** ${t.description}`);
      L.push("");
      const cfg = n.config || {};
      const rows = t.fields
        .filter(f => cfg[f.key] && String(cfg[f.key]).trim())
        .map(f => `| ${f.label} | ${escapePipes(cfg[f.key])} |`);
      if (rows.length) {
        L.push("| Setting | Value |");
        L.push("| --- | --- |");
        rows.forEach(r => L.push(r));
        L.push("");
      } else {
        L.push("_No details captured yet._");
        L.push("");
      }
      const outs = st.edges.filter(e => e.from === n.id)
        .map(e => st.nodes.find(x => x.id === e.to)).filter(Boolean)
        .map(x => `#${idToNum[x.id]} ${x.name || NODE_TYPES[x.type].label}`);
      L.push(outs.length ? `**Connects to:** ${outs.join(", ")}` : `**Connects to:** _(end of flow)_`);
      L.push("");
    });

    // Open items
    const gaps = [];
    order.forEach((n, i) => {
      const t = NODE_TYPES[n.type];
      const cfg = n.config || {};
      const filled = t.fields.some(f => cfg[f.key] && String(cfg[f.key]).trim());
      if (!filled) gaps.push(`Step ${i + 1} (${n.name || t.label}) has no details filled in.`);
    });
    const noOut = order.filter(n => !st.edges.some(e => e.from === n.id) && n.type !== "output");
    noOut.forEach(n => gaps.push(`"${n.name || NODE_TYPES[n.type].label}" is not connected to a next step.`));
    if (gaps.length) {
      L.push("## Open items for review");
      L.push("");
      gaps.forEach(g => L.push(`- [ ] ${g}`));
      L.push("");
    }

    L.push("---");
    L.push("");
    L.push("_This document describes the intended agent behavior for developer hand-off. Review the open items before building._");

    download(safeName(st.name) + "-requirements.md", L.join("\n"), "text/markdown");
    window.App.status("Requirements document exported (Markdown).");
  }

  function escapePipes(s) { return String(s).replace(/\|/g, "\\|").replace(/\n+/g, " "); }

  window.Exporters = { exportJson, exportPng, exportDoc };
})();
