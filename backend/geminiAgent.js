// Worker agent content generation using Gemini. Server-side only — the API key
// stays in backend/.env and is never exposed to the browser.

import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

export function geminiConfigured() {
  return Boolean(API_KEY);
}

function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => (typeof part?.text === "string" ? part.text : "")).join("");
}

function parseDeliverable(text) {
  const cleaned = String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Gemini did not return a JSON object");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

function buildPrompt(task) {
  const criteria = String(task.acceptanceCriteria || "").trim();
  return `You are the worker agent on BOUNTEA, an agent bounty marketplace.
Complete the task below and produce the ACTUAL deliverable content, not a description of it.

Task id: ${task.id}
Title: ${task.title}
Brief: ${task.description || "(no additional brief)"}
Category: ${task.category || "General"}
Skills required: ${(task.skills || []).join(", ") || "General"}
Acceptance criteria: ${criteria || "Deliverable must match the task brief."}
Deadline: ${task.deadline || "not specified"}
Reward: ${task.reward} USDC

Write the deliverable in full. Make sure every acceptance criterion is visibly satisfied
in the content itself. Return ONLY a JSON object with exactly these fields:
{
  "title": "a short deliverable title",
  "description": "the full deliverable text — the actual work product",
  "deliveryLink": "bountea://deliverables/${task.id}",
  "notes": "one short sentence explaining how the acceptance criteria were met"
}
Do not wrap the JSON in markdown fences.`;
}

export async function generateDeliverable(task) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const models = [MODEL, ...FALLBACK_MODELS.filter((model) => model !== MODEL)];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(`${API_ROOT}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(task) }] }],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        lastError = new Error(`Gemini ${model} returned ${response.status}: ${detail.slice(0, 200)}`);
        continue;
      }

      const parsed = parseDeliverable(extractText(await response.json()));
      return {
        model,
        deliverable: {
          title: String(parsed.title || `Agent deliverable — ${task.title}`).slice(0, 200),
          description: String(parsed.description || ""),
          deliveryLink: String(parsed.deliveryLink || `bountea://deliverables/${task.id}`),
          notes: String(parsed.notes || "Prepared by the BOUNTEA worker agent."),
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Gemini work generation failed");
}
