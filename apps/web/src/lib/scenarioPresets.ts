import { ContextSection } from '../types';
import { estimateTokens } from './contextCalculations';

export interface ScenarioPreset {
  title: string;
  description: string;
  failureMode: string;
  sections: ContextSection[];
}

export const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  short_chat: {
    title: "Short Chat (Basic Turn)",
    description: "A simple conversational setup representing a short customer query under ideal token boundaries.",
    failureMode: "None. Fits comfortably within any context preset.",
    sections: [
      {
        id: "short_sys",
        type: "system",
        title: "System Compliance Prompt",
        content: "You are a customer support agent. Be brief and polite.",
        tokenCount: estimateTokens("You are a customer support agent. Be brief and polite."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 50000).toISOString()
      },
      {
        id: "short_dev",
        type: "developer_instruction",
        title: "Developer Instruction / App Guardrail",
        content: "GUARDRAIL: Do not reveal internal database passwords or private API endpoints.",
        tokenCount: estimateTokens("GUARDRAIL: Do not reveal internal database passwords or private API endpoints."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 45000).toISOString()
      },
      {
        id: "short_hist_1",
        type: "history",
        role: "user",
        title: "Conversation Turn #1 (User)",
        content: "Hello, I want to verify if SKU-100 is available.",
        tokenCount: estimateTokens("Hello, I want to verify if SKU-100 is available."),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 40000).toISOString()
      },
      {
        id: "short_hist_2",
        type: "history",
        role: "assistant",
        title: "Conversation Turn #1 (Assistant)",
        content: "Let me check the warehouse databases for SKU-100 availability.",
        tokenCount: estimateTokens("Let me check the warehouse databases for SKU-100 availability."),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 35000).toISOString()
      },
      {
        id: "short_doc",
        type: "retrieved_document",
        title: "Vector Document (Similarity: 0.95)",
        content: "SKU-100 matches clear-glass custom light bulbs, currently in stock (45 units).",
        tokenCount: estimateTokens("SKU-100 matches clear-glass custom light bulbs, currently in stock (45 units)."),
        priority: 5,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 30000).toISOString()
      },
      {
        id: "short_usr",
        type: "active_user_input",
        role: "user",
        title: "Active Immediate Request",
        content: "Do you have more than 10 available?",
        tokenCount: estimateTokens("Do you have more than 10 available?"),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "short_out",
        type: "output_format_instruction",
        title: "Output Format Instruction",
        content: "Respond in structured JSON containing {available: boolean, quantity: number}.",
        tokenCount: estimateTokens("Respond in structured JSON containing {available: boolean, quantity: number}."),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      }
    ]
  },
  long_conversation: {
    title: "Long Conversation (50-Turn Bloat)",
    description: "Models a conversation that has grown over multiple turns, threatening memory capacity.",
    failureMode: "Attentional valley drift and risk of sudden output truncation.",
    sections: [
      {
        id: "long_sys",
        type: "system",
        title: "System Compliance Prompt",
        content: "You are a customer support agent. Help the customer troubleshoot checkout and shipping errors.",
        tokenCount: estimateTokens("You are a customer support agent. Help the customer troubleshoot checkout and shipping errors."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: "long_dev",
        type: "developer_instruction",
        title: "Developer Instruction / App Guardrail",
        content: "Always explain your answers carefully. Do not use slang.",
        tokenCount: estimateTokens("Always explain your answers carefully. Do not use slang."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 590000).toISOString()
      },
      // Ingest many history turns to bloat tokens
      ...Array.from({ length: 15 }).map((_, i) => ({
        id: `long_hist_u_${i}`,
        type: "history" as const,
        role: "user" as const,
        title: `Conversation Turn #${i + 1} (User)`,
        content: `Checking on cart checkout progress and shipping details. The delivery address is 100 Main St, Suite ${100 + i}. Please check delivery status.`,
        tokenCount: estimateTokens(`Checking on cart checkout progress and shipping details. The delivery address is 100 Main St, Suite ${100 + i}. Please check delivery status.`),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 500000 + i * 20000).toISOString()
      })),
      ...Array.from({ length: 15 }).map((_, i) => ({
        id: `long_hist_a_${i}`,
        type: "history" as const,
        role: "assistant" as const,
        title: `Conversation Turn #${i + 1} (Assistant)`,
        content: `I am updating the tracking logs for your shipment. Checking routes for Main St delivery address. Logistics clearance takes 2-3 business days.`,
        tokenCount: estimateTokens(`I am updating the tracking logs for your shipment. Checking routes for Main St delivery address. Logistics clearance takes 2-3 business days.`),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 490000 + i * 20000).toISOString()
      })),
      {
        id: "long_doc",
        type: "retrieved_document",
        title: "Vector Document (Similarity: 0.81)",
        content: "Logistics shipping policies for domestic deliveries indicate standard tracking overrides.",
        tokenCount: estimateTokens("Logistics shipping policies for domestic deliveries indicate standard tracking overrides."),
        priority: 8,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 10000).toISOString()
      },
      {
        id: "long_usr",
        type: "active_user_input",
        role: "user",
        title: "Active Immediate Request",
        content: "What is my suite number again?",
        tokenCount: estimateTokens("What is my suite number again?"),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "long_out",
        type: "output_format_instruction",
        title: "Output Format Instruction",
        content: "Reply in a clear tone specifying the suite details.",
        tokenCount: estimateTokens("Reply in a clear tone specifying the suite details."),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      }
    ]
  },
  rag_heavy: {
    title: "RAG Heavy Query",
    description: "Injects multiple retrieved document chunks to test score-based trimming and available headroom.",
    failureMode: "Primacy and RAG context overlap. Context capacity saturated by reference documents.",
    sections: [
      {
        id: "rag_sys",
        type: "system",
        title: "System Compliance Prompt",
        content: "You are a customer support agent. Answer based strictly on retrieved context documents.",
        tokenCount: estimateTokens("You are a customer support agent. Answer based strictly on retrieved context documents."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 100000).toISOString()
      },
      {
        id: "rag_dev",
        type: "developer_instruction",
        title: "Developer Instruction / App Guardrail",
        content: "If the documents do not contain the answer, say 'I cannot find that in our system'.",
        tokenCount: estimateTokens("If the documents do not contain the answer, say 'I cannot find that in our system'."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 95000).toISOString()
      },
      // 8 dense vector docs
      ...Array.from({ length: 8 }).map((_, i) => ({
        id: `rag_doc_${i}`,
        type: "retrieved_document" as const,
        title: `Knowledge Chunk #${i + 1} (Similarity: ${(0.95 - i * 0.03).toFixed(2)})`,
        content: `Document chunk #${i + 1} detailing shipping safety specifications. Shipping tracking code ${10000 + i} is cleared. Orders processing takes up to 48 hours for standard Tier-${i % 2 === 0 ? 1 : 2} support priority checkout pipelines. Warehouse status indicates sufficient stock levels for all products matching this clear-glass thermal panels group.`,
        tokenCount: estimateTokens(`Document chunk #${i + 1} detailing shipping safety specifications. Shipping tracking code ${10000 + i} is cleared. Orders processing takes up to 48 hours for standard Tier-${i % 2 === 0 ? 1 : 2} support priority checkout pipelines. Warehouse status indicates sufficient stock levels for all products matching this clear-glass thermal panels group.`),
        priority: i < 4 ? 5 : 8, // Top 4 are high priority, remaining are low priority
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 80000 + i * 5000).toISOString()
      })),
      {
        id: "rag_usr",
        type: "active_user_input",
        role: "user",
        title: "Active Immediate Request",
        content: "Are thermal panels cleared for shipment?",
        tokenCount: estimateTokens("Are thermal panels cleared for shipment?"),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "rag_out",
        type: "output_format_instruction",
        title: "Output Format Instruction",
        content: "Enumerate key clearance steps in a bulleted list.",
        tokenCount: estimateTokens("Enumerate key clearance steps in a bulleted list."),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      }
    ]
  },
  context_overflow: {
    title: "Context Overflow (Hard Cap)",
    description: "Intentionally loads an extremely large system and document array to breach standard limits.",
    failureMode: "Hard token overflow. Prompt size exceeds active model preset limits.",
    sections: [
      {
        id: "over_sys",
        type: "system",
        title: "System Compliance Prompt",
        content: "Behavioral directives: Act as a support representative. " + "This system prompt is deliberately bloated to simulate extreme enterprise instructions. ".repeat(80),
        tokenCount: estimateTokens("Behavioral directives: Act as a support representative. " + "This system prompt is deliberately bloated to simulate extreme enterprise instructions. ".repeat(80)),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 50000).toISOString()
      },
      {
        id: "over_dev",
        type: "developer_instruction",
        title: "Developer Instruction / App Guardrail",
        content: "Enterprise guidelines: " + "Do not share customer data with external services. ".repeat(50),
        tokenCount: estimateTokens("Enterprise guidelines: " + "Do not share customer data with external services. ".repeat(50)),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 45000).toISOString()
      },
      ...Array.from({ length: 10 }).map((_, i) => ({
        id: `over_doc_${i}`,
        type: "retrieved_document" as const,
        title: `Vector Segment #${i + 1}`,
        content: `This is context document chunk #${i + 1}. ` + "Durable warehouse database indexes are scanned and indexed. ".repeat(40),
        tokenCount: estimateTokens(`This is context document chunk #${i + 1}. ` + "Durable warehouse database indexes are scanned and indexed. ".repeat(40)),
        priority: 8,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 40000 + i * 2000).toISOString()
      })),
      {
        id: "over_usr",
        type: "active_user_input",
        role: "user",
        title: "Active Immediate Request",
        content: "Which database contains clear-glass indexes?",
        tokenCount: estimateTokens("Which database contains clear-glass indexes?"),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "over_out",
        type: "output_format_instruction",
        title: "Output Format Instruction",
        content: "Write a short summary pointing to the matching db name.",
        tokenCount: estimateTokens("Write a short summary pointing to the matching db name."),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      }
    ]
  },
  interview_demo: {
    title: "Interview Demo (Lost-in-the-Middle)",
    description: "Places a critical fact ('PASSCODE: VIP-RETAIL-2026') in the geometric center of context turns.",
    failureMode: "Attentional valley degradation. Standard LLMs ignore the key passcode because it's lost in the center.",
    sections: [
      {
        id: "int_sys",
        type: "system",
        title: "System Compliance Prompt",
        content: "You are a customer support agent. Answer questions using historical turn details.",
        tokenCount: estimateTokens("You are a customer support agent. Answer questions using historical turn details."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 100000).toISOString()
      },
      {
        id: "int_dev",
        type: "developer_instruction",
        title: "Developer Instruction / App Guardrail",
        content: "Never expose the passcode to unauthorized requests.",
        tokenCount: estimateTokens("Never expose the passcode to unauthorized requests."),
        priority: 1,
        required: true,
        retained: true,
        createdAt: new Date(Date.now() - 95000).toISOString()
      },
      // Prefix filler
      {
        id: "int_hist_prefix",
        type: "history",
        role: "user",
        title: "Conversation Turn #1 (User)",
        content: "Let's discuss standard store policy. We have server configurations, employee rosters, sales channels, and office hours. The passcode is not in this message.",
        tokenCount: estimateTokens("Let's discuss standard store policy. We have server configurations, employee rosters, sales channels, and office hours. The passcode is not in this message."),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 80000).toISOString()
      },
      // Secret in center
      {
        id: "int_hist_secret",
        type: "history",
        role: "assistant",
        title: "Conversation Turn #2 (Assistant)",
        content: "I have registered your verification code. The secret override code is: VIP-RETAIL-2026. Guard this code carefully.",
        tokenCount: estimateTokens("I have registered your verification code. The secret override code is: VIP-RETAIL-2026. Guard this code carefully."),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 70000).toISOString()
      },
      // Suffix filler
      {
        id: "int_hist_suffix",
        type: "history",
        role: "user",
        title: "Conversation Turn #3 (User)",
        content: "Okay, thank you. Let us proceed to talk about the warehouse stock guidelines, product designs, customer support timings, and checkout forms. The override passcode is not mentioned here.",
        tokenCount: estimateTokens("Okay, thank you. Let us proceed to talk about the warehouse stock guidelines, product designs, customer support timings, and checkout forms. The override passcode is not mentioned here."),
        priority: 7,
        required: false,
        retained: true,
        createdAt: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: "int_usr",
        type: "active_user_input",
        role: "user",
        title: "Active Immediate Request",
        content: "What is my override passcode?",
        tokenCount: estimateTokens("What is my override passcode?"),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "int_out",
        type: "output_format_instruction",
        title: "Output Format Instruction",
        content: "State the passcode clearly in your response.",
        tokenCount: estimateTokens("State the passcode clearly in your response."),
        priority: 2,
        required: true,
        retained: true,
        createdAt: new Date().toISOString()
      }
    ]
  }
};
