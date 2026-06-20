export interface ModelPreset {
  id: string;
  name: string;
  contextLimit: number;
  description: string;
}

export const MODEL_PRESETS: Record<string, ModelPreset> = {
  gpt4o_mini: {
    id: "gpt4o_mini",
    name: "GPT-4o mini style (128k)",
    contextLimit: 128000,
    description: "Ideal for long conversations and document retrieval (128,000 tokens)."
  },
  gpt41: {
    id: "gpt41",
    name: "GPT-4.1 style (1M)",
    contextLimit: 1000000,
    description: "Designed for massive multi-document prompt packing (1,000,000 tokens)."
  },
  claude_placeholder: {
    id: "claude_placeholder",
    name: "Claude style placeholder (200k)",
    contextLimit: 200000,
    description: "Generic placeholder representation (200,000 tokens)."
  },
  custom: {
    id: "custom",
    name: "Custom Context Window",
    contextLimit: 32768, // Default custom size
    description: "User defined context window limit."
  }
};
