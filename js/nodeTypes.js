/* ============================================================
   Copilot Agent node-type catalog.
   Each entry drives the palette, the node card, and the
   property panel. To add a new building block, add an entry
   here — no other file needs to change.

   Field types supported by the panel: "text", "textarea", "select".
   ============================================================ */
window.NODE_TYPES = {
  /* ---------- Entry points ---------- */
  trigger: {
    label: "Trigger",
    icon: "⚡",
    color: "#f59e0b",
    description: "How the agent gets started — the event that kicks off the workflow.",
    defaults: { triggerType: "User message" },
    fields: [
      { key: "triggerType", label: "Trigger type", type: "select",
        options: ["User message", "Conversation start", "Activity received", "Event triggered",
                  "Scheduled / recurring", "Inactivity timeout", "Incoming email", "Form submission",
                  "Teams message", "Power Automate flow", "Event from another system"] },
      { key: "details", label: "When does it fire?", type: "textarea",
        placeholder: "e.g. A user asks the agent a question in Teams" }
    ]
  },

  topic: {
    label: "Topic",
    icon: "💬",
    color: "#fb923c",
    description: "A reusable conversation unit matched by user intent — can act as its own entry point (a topic can be the trigger).",
    defaults: { triggerKind: "Phrases" },
    fields: [
      { key: "triggerKind", label: "How the topic is triggered", type: "select",
        options: ["Phrases", "When a message is received", "Activity received", "Event triggered",
                  "Called by another topic", "Custom trigger"] },
      { key: "phrases", label: "Trigger phrases", type: "textarea",
        placeholder: "One phrase per line — e.g.\nreset my password\nI'm locked out" },
      { key: "details", label: "What does this topic handle?", type: "textarea",
        placeholder: "The conversation goal this topic is responsible for" }
    ]
  },

  /* ---------- Reasoning ---------- */
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

  prompt: {
    label: "Prompt (AI Builder)",
    icon: "✨",
    color: "#a855f7",
    description: "A custom AI prompt that transforms input or generates content — the 'New prompt' building block.",
    defaults: { model: "Default" },
    fields: [
      { key: "model", label: "Model", type: "select",
        options: ["Default", "GPT-4o", "GPT-4.1", "o-series (reasoning)"] },
      { key: "promptText", label: "Prompt text", type: "textarea",
        placeholder: "Summarize {{Topic.UserMessage}} into three bullet points..." },
      { key: "inputs", label: "Inputs / variables used", type: "text",
        placeholder: "e.g. UserMessage, TicketBody" },
      { key: "outputVar", label: "Save result to variable", type: "text",
        placeholder: "e.g. Summary" }
    ]
  },

  /* ---------- Knowledge & data ---------- */
  knowledge: {
    label: "Knowledge Source",
    icon: "📚",
    color: "#3b82f6",
    description: "Data the agent reads to ground its answers (grounding / retrieval).",
    defaults: { sourceType: "SharePoint" },
    fields: [
      { key: "sourceType", label: "Source type", type: "select",
        options: ["SharePoint", "OneDrive", "Website / URL", "Dataverse", "SQL / database",
                  "Document upload", "Graph connector", "Public web search", "Other"] },
      { key: "location", label: "Location / link", type: "text",
        placeholder: "Site, library, URL, or table name" },
      { key: "details", label: "What does it provide?", type: "textarea",
        placeholder: "e.g. Product manuals the agent should cite" }
    ]
  },

  entity: {
    label: "Entity",
    icon: "🏷️",
    color: "#6366f1",
    description: "Defines the information the agent should recognize and extract from user input.",
    defaults: { entityType: "Closed list" },
    fields: [
      { key: "entityType", label: "Entity type", type: "select",
        options: ["Closed list", "Regular expression", "Prebuilt (Number, Date, Email, etc.)", "Custom"] },
      { key: "values", label: "Values / pattern / synonyms", type: "textarea",
        placeholder: "List items, a regex, or synonyms the agent should match" },
      { key: "details", label: "Notes", type: "textarea", placeholder: "Optional extra context" }
    ]
  },

  /* ---------- Conversation flow ---------- */
  question: {
    label: "Ask a Question",
    icon: "❓",
    color: "#eab308",
    description: "Prompts the user for input and captures the answer — with optional entity / slot filling.",
    defaults: { responseType: "Multiple choice" },
    fields: [
      { key: "questionText", label: "Question to ask", type: "textarea",
        placeholder: "e.g. Which device are you having trouble with?" },
      { key: "responseType", label: "Identify (response type)", type: "select",
        options: ["User's entire response", "Multiple choice options", "Number", "Date & time",
                  "Email", "Person", "Yes / No (boolean)", "Custom entity"] },
      { key: "choices", label: "Choices (if multiple choice)", type: "textarea",
        placeholder: "One option per line — e.g.\nLaptop\nPhone\nPrinter" },
      { key: "saveTo", label: "Save answer to variable", type: "text",
        placeholder: "e.g. DeviceType" }
    ]
  },

  setVariable: {
    label: "Set Variable",
    icon: "🟰",
    color: "#f43f5e",
    description: "Assigns or updates the value of a variable used later in the flow.",
    defaults: { scope: "Topic" },
    fields: [
      { key: "variable", label: "Variable name", type: "text", placeholder: "e.g. Priority" },
      { key: "value", label: "Value or expression", type: "textarea",
        placeholder: 'e.g. "High"  or  Topic.TicketCount + 1' },
      { key: "scope", label: "Scope", type: "select", options: ["Topic", "Global", "System"] }
    ]
  },

  parseValue: {
    label: "Parse Value",
    icon: "🔧",
    color: "#ef4444",
    description: "Parses or converts a value into a typed variable (text, number, JSON, record, table…).",
    defaults: { parseAs: "Text" },
    fields: [
      { key: "source", label: "Value to parse", type: "text",
        placeholder: "e.g. Topic.ConnectorResponse.body" },
      { key: "parseAs", label: "Parse as type", type: "select",
        options: ["Text", "Number", "Boolean", "Date & time", "JSON / record", "Table / list", "Custom schema"] },
      { key: "outputVar", label: "Save parsed value to", type: "text", placeholder: "e.g. ParsedRecord" }
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

  redirect: {
    label: "Redirect to Topic",
    icon: "↪️",
    color: "#d946ef",
    description: "Hands the conversation off to another topic to continue the flow.",
    defaults: {},
    fields: [
      { key: "targetTopic", label: "Go to topic", type: "text", placeholder: "e.g. Escalation" },
      { key: "details", label: "Notes", type: "textarea", placeholder: "Why redirect here?" }
    ]
  },

  /* ---------- Tools & extensibility ---------- */
  action: {
    label: "Action / Tool",
    icon: "⚙️",
    color: "#10b981",
    description: "Something the agent does — calls a tool, writes data, or triggers another system.",
    defaults: { actionType: "Send email" },
    fields: [
      { key: "actionType", label: "Action type", type: "select",
        options: ["Send email", "Post Teams message", "Create item / record", "Update record",
                  "Call an API", "Run Power Automate flow", "Generate document", "Search", "Other"] },
      { key: "target", label: "Target system", type: "text",
        placeholder: "e.g. Outlook, ServiceNow, a SharePoint list" },
      { key: "details", label: "Notes", type: "textarea",
        placeholder: "What exactly should happen here?" }
    ]
  },

  connector: {
    label: "Connector",
    icon: "🔌",
    color: "#14b8a6",
    description: "Calls a Power Platform, custom, or MCP connector action to read or write to an external system.",
    defaults: { connectorType: "Prebuilt connector" },
    fields: [
      { key: "connectorType", label: "Connector type", type: "select",
        options: ["Prebuilt connector", "Custom connector", "MCP server", "HTTP request"] },
      { key: "connectorName", label: "Connector / action", type: "text",
        placeholder: "e.g. ServiceNow – Create Record" },
      { key: "inputs", label: "Inputs passed", type: "textarea",
        placeholder: "Parameters and the variables that feed them" },
      { key: "outputVar", label: "Save response to variable", type: "text", placeholder: "e.g. ApiResponse" }
    ]
  },

  agentFlow: {
    label: "Agent Flow",
    icon: "🌊",
    color: "#22c55e",
    description: "A Power Automate-style flow built into the agent to run deterministic, multi-step automation.",
    defaults: {},
    fields: [
      { key: "flowName", label: "Flow name", type: "text", placeholder: "e.g. Provision new mailbox" },
      { key: "inputs", label: "Inputs passed to the flow", type: "textarea", placeholder: "e.g. UserEmail, Department" },
      { key: "outputVar", label: "Outputs returned", type: "text", placeholder: "e.g. ProvisioningResult" },
      { key: "details", label: "Notes", type: "textarea", placeholder: "What the flow automates" }
    ]
  },

  skill: {
    label: "Skill",
    icon: "🧩",
    color: "#84cc16",
    description: "A connected skill that extends the agent with additional capabilities or actions.",
    defaults: { skillType: "Connected skill" },
    fields: [
      { key: "skillType", label: "Skill type", type: "select",
        options: ["Connected skill", "Bot Framework skill", "Copilot Studio skill", "Custom"] },
      { key: "skillName", label: "Skill name", type: "text", placeholder: "e.g. Translation skill" },
      { key: "details", label: "What does it add?", type: "textarea", placeholder: "Capability this skill provides" }
    ]
  },

  /* ---------- Multi-agent orchestration ---------- */
  childAgent: {
    label: "Child Agent",
    icon: "🤖",
    color: "#0ea5e9",
    description: "Calls a connected child agent to handle a specialized task, then returns control to the parent.",
    defaults: {},
    fields: [
      { key: "agentName", label: "Child agent name", type: "text", placeholder: "e.g. HR Policy Agent" },
      { key: "task", label: "What the child agent handles", type: "textarea",
        placeholder: "The specialized job delegated to this agent" },
      { key: "inputs", label: "Inputs passed", type: "text", placeholder: "e.g. EmployeeId, Question" },
      { key: "outputVar", label: "Result returned to parent", type: "text", placeholder: "e.g. AgentAnswer" }
    ]
  },

  multiAgent: {
    label: "Multi-Agent Orchestration",
    icon: "🕸️",
    color: "#2563eb",
    description: "Orchestrates work across multiple agents — routing each request to the best-suited agent.",
    defaults: { orchestration: "Generative (model decides)" },
    fields: [
      { key: "orchestration", label: "Orchestration style", type: "select",
        options: ["Generative (model decides)", "Rules / routing logic", "Sequential", "Parallel"] },
      { key: "agents", label: "Agents involved & their specialties", type: "textarea",
        placeholder: "e.g.\nIT Agent – password & device issues\nHR Agent – benefits & policy" },
      { key: "details", label: "Routing notes", type: "textarea", placeholder: "How requests are split or combined" }
    ]
  },

  /* ---------- Identity & escalation ---------- */
  authentication: {
    label: "Authentication",
    icon: "🔐",
    color: "#64748b",
    description: "Requires the user to sign in before the agent continues.",
    defaults: { authType: "Microsoft Entra ID" },
    fields: [
      { key: "authType", label: "Authentication", type: "select",
        options: ["Microsoft Entra ID", "OAuth (generic)", "Manual / API key", "No authentication"] },
      { key: "scope", label: "Scopes / required permissions", type: "text",
        placeholder: "e.g. User.Read, Sites.Read.All" },
      { key: "details", label: "Notes", type: "textarea", placeholder: "When sign-in is required" }
    ]
  },

  humanHandoff: {
    label: "Transfer to Human",
    icon: "🙋",
    color: "#f97316",
    description: "Escalates and transfers the conversation to a live human agent.",
    defaults: { destination: "Microsoft Teams" },
    fields: [
      { key: "destination", label: "Hand off to", type: "select",
        options: ["Omnichannel / Contact center", "Microsoft Teams", "Email", "External ticket", "Custom"] },
      { key: "context", label: "Context passed to the human", type: "textarea",
        placeholder: "Summary, variables, and history the agent should hand over" }
    ]
  },

  /* ---------- Delivery & publishing ---------- */
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
  },

  channel: {
    label: "Channel / Publish",
    icon: "📡",
    color: "#0891b2",
    description: "Where the agent is published and surfaced to users.",
    defaults: { channel: "Microsoft Teams" },
    fields: [
      { key: "channel", label: "Channel", type: "select",
        options: ["Microsoft Teams", "Microsoft 365 Copilot", "Web / custom website", "Demo website",
                  "Slack", "Facebook", "Phone (voice)", "Custom"] },
      { key: "details", label: "Notes", type: "textarea", placeholder: "Audience, URL, or app details" }
    ]
  }
};

/* Order used in the palette — grouped: entry → reasoning → knowledge →
   conversation flow → tools → multi-agent → identity → delivery */
window.NODE_ORDER = [
  "trigger", "topic",
  "instructions", "prompt",
  "knowledge", "entity",
  "question", "setVariable", "parseValue", "condition", "redirect",
  "action", "connector", "agentFlow", "skill",
  "childAgent", "multiAgent",
  "authentication", "humanHandoff",
  "output", "channel"
];

/* Node card dimensions (world units) */
window.NODE_W = 210;
window.NODE_H = 66;
