/* ============================================================
   Copilot Agent node-type catalog.
   Each entry drives the palette, the node card, and the
   property panel. To add a new building block, add an entry
   here — no other file needs to change.
   ============================================================ */
window.NODE_TYPES = {
  trigger: {
    label: "Trigger",
    icon: "⚡",
    color: "#f59e0b",
    description: "How the agent gets started — the event that kicks off the workflow.",
    defaults: { triggerType: "User message" },
    fields: [
      { key: "triggerType", label: "Trigger type", type: "select",
        options: ["User message", "Scheduled / recurring", "Incoming email", "Form submission", "Teams message", "Power Automate flow", "Event from another system"] },
      { key: "details", label: "When does it fire?", type: "textarea",
        placeholder: "e.g. A user asks the agent a question in Teams" }
    ]
  },

  knowledge: {
    label: "Knowledge Source",
    icon: "📚",
    color: "#3b82f6",
    description: "Data the agent reads to ground its answers (grounding / retrieval).",
    defaults: { sourceType: "SharePoint" },
    fields: [
      { key: "sourceType", label: "Source type", type: "select",
        options: ["SharePoint", "OneDrive", "Website / URL", "Dataverse", "SQL / database", "Document upload", "Graph connector", "Public web search", "Other"] },
      { key: "location", label: "Location / link", type: "text",
        placeholder: "Site, library, URL, or table name" },
      { key: "details", label: "What does it provide?", type: "textarea",
        placeholder: "e.g. Product manuals the agent should cite" }
    ]
  },

  instructions: {
    label: "Agent Instructions",
    icon: "🧠",
    color: "#8b5cf6",
    description: "The reasoning brain — the model and the prompt that define how the agent thinks.",
    defaults: { model: "Default", tone: "Professional" },
    fields: [
      { key: "model", label: "Model", type: "select",
        options: ["Default", "GPT-4o", "GPT-4.1", "o-series (reasoning)"] },
      { key: "instructions", label: "Instructions / system prompt", type: "textarea",
        placeholder: "You are an assistant that helps the IT team triage tickets..." },
      { key: "tone", label: "Tone", type: "select",
        options: ["Professional", "Friendly", "Concise", "Technical", "Neutral"] }
    ]
  },

  action: {
    label: "Action / Tool",
    icon: "⚙️",
    color: "#10b981",
    description: "Something the agent does — calls a tool, writes data, or triggers another system.",
    defaults: { actionType: "Send email" },
    fields: [
      { key: "actionType", label: "Action type", type: "select",
        options: ["Send email", "Post Teams message", "Create item / record", "Update record", "Call an API", "Run Power Automate flow", "Generate document", "Search", "Other"] },
      { key: "target", label: "Target system", type: "text",
        placeholder: "e.g. Outlook, ServiceNow, a SharePoint list" },
      { key: "details", label: "Notes", type: "textarea",
        placeholder: "What exactly should happen here?" }
    ]
  },

  condition: {
    label: "Condition / Branch",
    icon: "🔀",
    color: "#ec4899",
    description: "Logic that routes the workflow down different paths based on a rule.",
    defaults: {},
    fields: [
      { key: "expression", label: "Condition", type: "textarea",
        placeholder: "e.g. If ticket priority = High → escalate, otherwise → auto-reply" },
      { key: "details", label: "Notes", type: "textarea", placeholder: "Optional extra context" }
    ]
  },

  output: {
    label: "Output / Response",
    icon: "📤",
    color: "#06b6d4",
    description: "What the end user finally receives back from the agent.",
    defaults: { outputType: "Chat reply" },
    fields: [
      { key: "outputType", label: "Output type", type: "select",
        options: ["Chat reply", "Email", "Adaptive Card", "Document", "Form", "Teams message"] },
      { key: "details", label: "Notes", type: "textarea",
        placeholder: "Format, what it should contain, etc." }
    ]
  }
};

/* Order used in the palette */
window.NODE_ORDER = ["trigger", "knowledge", "instructions", "action", "condition", "output"];

/* Node card dimensions (world units) */
window.NODE_W = 210;
window.NODE_H = 66;
