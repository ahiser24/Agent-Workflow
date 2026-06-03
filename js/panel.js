/* ============================================================
   panel.js — builds the left palette and the right property
   panel. The panel renders fields from the selected node's
   type definition and writes edits straight back to state.
   ============================================================ */
(function () {
  // ---------- Palette ----------
  function buildPalette() {
    const host = document.getElementById("paletteItems");
    host.innerHTML = "";
    window.NODE_ORDER.forEach(type => {
      const t = NODE_TYPES[type];
      const item = document.createElement("div");
      item.className = "palette-item";
      item.style.borderLeftColor = t.color;
      item.draggable = true;
      item.innerHTML =
        `<span class="pi-icon">${t.icon}</span>
         <span class="pi-text">
           <span class="pi-label">${t.label}</span>
           <span class="pi-desc">${shortDesc(t.description)}</span>
         </span>`;
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/node-type", type);
        e.dataTransfer.effectAllowed = "copy";
      });
      item.addEventListener("click", () => {
        window.Editor.addNodeCenter(type);
        // NEW: On mobile, close palette after adding so user can see canvas
        if (window.innerWidth <= 850) {
          document.getElementById("palette").classList.remove("open");
        }
      });
      host.appendChild(item);
    });
  }

  function shortDesc(d) { return d.split("—")[0].split("(")[0].trim(); }

  // ---------- Property panel ----------
  function renderPanel(selection) {
    const empty = document.getElementById("panelEmpty");
    const body = document.getElementById("panelBody");
    const node = window.Editor.getSelectedNode();

    if (!node) {
      empty.hidden = false;
      body.hidden = true;
      body.innerHTML = "";
      return;
    }

    const t = NODE_TYPES[node.type];
    empty.hidden = true;
    body.hidden = false;
    body.innerHTML = "";

    // header
    const head = document.createElement("div");
    head.className = "panel-head";
    head.innerHTML = `<span class="ph-icon">${t.icon}</span>
      <span class="ph-type" style="color:${t.color}">${t.label}</span>`;
    body.appendChild(head);

    const desc = document.createElement("div");
    desc.className = "panel-desc";
    desc.textContent = t.description;
    body.appendChild(desc);

    // name field (always first)
    body.appendChild(buildField({ key: "__name", label: "Step name", type: "text",
      placeholder: t.label }, node.name, (val) => {
        node.name = val;
        window.Editor.updateNodeVisual(node);
        save();
      }));

    // type-specific fields
    t.fields.forEach(f => {
      const val = (node.config && node.config[f.key]) || "";
      body.appendChild(buildField(f, val, (v) => {
        node.config = node.config || {};
        node.config[f.key] = v;
        window.Editor.updateNodeVisual(node);
        save();
      }));
    });

    // delete button
    const del = document.createElement("button");
    del.className = "panel-delete";
    del.textContent = "Delete this node";
    del.addEventListener("click", () => window.Editor.deleteSelected());
    body.appendChild(del);
  }

  function buildField(f, value, onInput) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const label = document.createElement("label");
    label.textContent = f.label;
    wrap.appendChild(label);

    let input;
    if (f.type === "textarea") {
      input = document.createElement("textarea");
      input.value = value || "";
      input.placeholder = f.placeholder || "";
    } else if (f.type === "select") {
      input = document.createElement("select");
      f.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt; o.textContent = opt;
        if (opt === value) o.selected = true;
        input.appendChild(o);
      });
      if (!value && f.options.length) onInput(f.options[0]); // seed default
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.value = value || "";
      input.placeholder = f.placeholder || "";
    }
    input.addEventListener("input", () => onInput(input.value));
    input.addEventListener("change", () => onInput(input.value));
    wrap.appendChild(input);
    return wrap;
  }

  function save() { if (window.App && window.App.persist) window.App.persist(); }

  window.Panel = { buildPalette, renderPanel };
})();