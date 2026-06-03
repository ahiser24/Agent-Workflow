# Copilot Agent Workflow Designer

A lightweight, drag-and-drop canvas (N8N-style) for sketching out **how a Copilot
Agent should work** — so business users can describe the goal and flow, and
developers get a clear spec to build from.

No installation, no internet, no build step. It's plain HTML + CSS + JavaScript.

---

## How to open it

1. Open the folder `copilot-workflow-designer`.
2. Double-click **`index.html`** — it opens in your browser (Edge, Chrome, etc.).

That's it. To share it, zip the whole folder or drop it in a SharePoint/OneDrive
library and have people open `index.html`.

---

## How to use it

**Build the flow**
- **Add a step:** drag a building block from the left palette onto the canvas, or click it.
- **Connect steps:** drag from a node's **right dot** to the next node's **left dot**.
- **Edit a step:** click a node, then fill in its details on the right panel.
- **Move things:** drag a node to reposition; drag empty space to pan; scroll to zoom.
- **Remove:** select a node or a connection line and press **Delete**.

Your work auto-saves in the browser, so it's still there when you reopen the page.

**Building blocks (tuned for Copilot Studio agents)**

The palette mirrors the building blocks you'd assemble in Copilot Studio,
grouped by purpose.

_Entry points_

| Block | What it represents |
| --- | --- |
| ⚡ Trigger | How the agent starts (a user message, a schedule, an event, an email, a form…) |
| 💬 Topic | A reusable conversation unit matched by intent / phrases — can be the trigger itself |

_Reasoning_

| Block | What it represents |
| --- | --- |
| 🧠 Agent Instructions | The model + prompt that define how the agent reasons |
| ✨ Prompt (AI Builder) | A custom AI prompt that transforms input or generates content ("New prompt") |

_Knowledge & data_

| Block | What it represents |
| --- | --- |
| 📚 Knowledge Source | Data the agent reads to ground answers (SharePoint, a website, a database…) |
| 🏷️ Entity | What information to recognize and extract from user input |

_Conversation flow_

| Block | What it represents |
| --- | --- |
| ❓ Ask a Question | Prompts the user for input and captures it (with slot / entity filling) |
| 🟰 Set Variable | Assigns or updates a variable used later in the flow |
| 🔧 Parse Value | Converts a value into a typed variable (text, number, JSON, record, table…) |
| 🔀 Condition / Branch | Logic that routes the flow based on a rule |
| ↪️ Redirect to Topic | Hands the conversation off to another topic |

_Tools & extensibility_

| Block | What it represents |
| --- | --- |
| ⚙️ Action / Tool | Something the agent does (send email, create a record, call an API…) |
| 🔌 Connector | A Power Platform, custom, or MCP connector action |
| 🌊 Agent Flow | A built-in Power Automate-style flow for deterministic automation |
| 🧩 Skill | A connected skill that adds capabilities or actions |

_Multi-agent orchestration_

| Block | What it represents |
| --- | --- |
| 🤖 Child Agent | Delegates a specialized task to a connected agent, then returns |
| 🕸️ Multi-Agent Orchestration | Routes work across multiple agents to the best-suited one |

_Identity & escalation_

| Block | What it represents |
| --- | --- |
| 🔐 Authentication | Requires the user to sign in before continuing |
| 🙋 Transfer to Human | Escalates the conversation to a live human agent |

_Delivery & publishing_

| Block | What it represents |
| --- | --- |
| 📤 Output / Response | What the user finally receives back |
| 📡 Channel / Publish | Where the agent is surfaced (Teams, M365 Copilot, web, voice…) |

**Export / hand off**
- **Export JSON** — a machine-readable definition (re-import it later with *Import*).
- **Export PNG** — the diagram as an image for docs, tickets, or email.
- **Requirements Doc** — an ordered, readable Markdown spec (each step, its purpose,
  settings, and what it connects to) for developer hand-off.

---

## For developers — extending it

All node types live in **`js/nodeTypes.js`**. To add or change a building block,
edit that one file — add an entry with an `icon`, `color`, `description`, and a
list of `fields`, then list its key in `NODE_ORDER`. The palette, the node card,
the property panel, and the requirements export all update automatically.

Fields support three input types: `text`, `textarea`, and `select` (with `options`).

```
copilot-workflow-designer/
├── index.html          ← page shell
├── css/styles.css      ← all styling
└── js/
    ├── nodeTypes.js     ← the building-block catalog (edit here to extend)
    ├── editor.js        ← canvas: drag, pan/zoom, connections, selection
    ├── panel.js         ← left palette + right property panel
    ├── exporters.js     ← PNG / JSON / requirements-doc generation
    └── app.js           ← toolbar wiring, autosave, sample workflow
```

No external libraries — everything is rendered with native SVG, which is also how
the PNG export works (the live diagram is serialized straight to an image).
