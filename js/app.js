/* ============================================================
   app.js — boots everything, wires the toolbar, persists to
   localStorage, and seeds a sample workflow on first run.
   ============================================================ */
(function () {
  const STORAGE_KEY = "copilot-workflow-designer:v1";

  function status(msg) {
    document.getElementById("statusText").textContent = msg;
  }

  function updateCounts() {
    const st = window.Editor.state;
    document.getElementById("counts").textContent =
      `${st.nodes.length} node${st.nodes.length === 1 ? "" : "s"} · ${st.edges.length} connection${st.edges.length === 1 ? "" : "s"}`;
  }

  function persist() {
    try {
      const data = window.Editor.serialize();
      data.name = document.getElementById("workflowName").value || "Untitled workflow";
      window.Editor.state.name = data.name;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      updateCounts();
    } catch (e) { /* storage may be unavailable; ignore */ }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.nodes || !data.nodes.length) return false;
      window.Editor.load(data);
      document.getElementById("workflowName").value = data.name || "Untitled workflow";
      return true;
    } catch (e) { return false; }
  }

  // -------- Sample workflow (mirrors a typical agent flow) --------
  function seedSample() {
    const E = window.Editor;
    E.clear();
    E.state.name = "Sample: IT Ticket Triage Agent";
    document.getElementById("workflowName").value = E.state.name;
    const Y = 180, GAP = 270;
    const n1 = E.addNode("trigger", 40, Y);
    n1.name = "User asks in Teams";
    n1.config = { triggerType: "Teams message", details: "An employee messages the IT agent describing a problem." };
    const n2 = E.addNode("knowledge", 40 + GAP, Y);
    n2.name = "IT Knowledge Base";
    n2.config = { sourceType: "SharePoint", location: "IT Support site / How-To library", details: "Troubleshooting articles and known fixes." };
    const n3 = E.addNode("instructions", 40 + GAP * 2, Y);
    n3.name = "Triage reasoning";
    n3.config = { model: "GPT-4o", instructions: "Identify the issue, suggest a fix from the knowledge base, and decide whether to auto-resolve or escalate.", tone: "Professional" };
    const n4 = E.addNode("condition", 40 + GAP * 3, Y);
    n4.name = "Resolved or escalate?";
    n4.config = { expression: "If a confident fix exists → reply to user. Otherwise → create a ServiceNow ticket." };
    const n5 = E.addNode("action", 40 + GAP * 4, Y - 90);
    n5.name = "Create ServiceNow ticket";
    n5.config = { actionType: "Create item / record", target: "ServiceNow", details: "Open an incident with the captured details and priority." };
    const n6 = E.addNode("output", 40 + GAP * 4, Y + 90);
    n6.name = "Reply to employee";
    n6.config = { outputType: "Teams message", details: "Send the suggested fix or the ticket number back in chat." };

    // connect
    E.select(null, null);
    E.state.edges.push({ id: "e1", from: n1.id, to: n2.id });
    E.state.edges.push({ id: "e2", from: n2.id, to: n3.id });
    E.state.edges.push({ id: "e3", from: n3.id, to: n4.id });
    E.state.edges.push({ id: "e4", from: n4.id, to: n5.id });
    E.state.edges.push({ id: "e5", from: n4.id, to: n6.id });
    E.render();
    E.fit();
    persist();
  }

  function newBlank() {
    if (window.Editor.state.nodes.length &&
        !confirm("Start a new blank workflow? Your current canvas will be cleared.")) return;
    window.Editor.clear();
    document.getElementById("workflowName").value = "Untitled workflow";
    persist();
    status("New blank workflow.");
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        window.Editor.load(data);
        document.getElementById("workflowName").value = data.name || "Imported workflow";
        persist();
        status("Workflow imported.");
      } catch (e) { status("That file could not be read as a workflow."); }
    };
    reader.readAsText(file);
  }

  function wireToolbar() {
    document.getElementById("btnNew").addEventListener("click", newBlank);
    document.getElementById("btnExportJson").addEventListener("click", () => window.Exporters.exportJson());
    document.getElementById("btnExportPng").addEventListener("click", () => window.Exporters.exportPng());
    document.getElementById("btnExportDoc").addEventListener("click", () => window.Exporters.exportDoc());

    const fileInput = document.getElementById("fileImport");
    document.getElementById("btnImport").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => { if (e.target.files[0]) importFile(e.target.files[0]); e.target.value = ""; });

    document.getElementById("workflowName").addEventListener("input", persist);

    document.getElementById("btnZoomIn").addEventListener("click", () => window.Editor.zoomBy(1.15));
    document.getElementById("btnZoomOut").addEventListener("click", () => window.Editor.zoomBy(0.87));
    document.getElementById("btnFit").addEventListener("click", () => window.Editor.fit());

    // keyboard: delete selected
    document.addEventListener("keydown", (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement.tagName);
      if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        window.Editor.deleteSelected();
      }
    });
  }

  // -------- Boot --------
  window.App = { status, persist };

  window.addEventListener("DOMContentLoaded", () => {
    window.Panel.buildPalette();
    window.Editor.init({
      onChange: () => { persist(); },
      onSelect: (sel) => { window.Panel.renderPanel(sel); }
    });
    wireToolbar();

    const restored = loadSaved();
    if (!restored) seedSample();
    updateCounts();
    status("Ready. Drag a block from the left, or edit the sample workflow.");
  });
})();
