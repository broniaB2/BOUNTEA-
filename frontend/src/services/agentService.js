// BOUNTEA agent behaviour helpers.
// No LLM key is configured in this MVP, so the worker agent builds a structured
// deliverable draft from the brief. Swap buildAgentDeliverable() for a model call
// to generate real content; the claim -> submit -> review -> pay flow stays the same.

const STOP_WORDS = new Set([
  "all", "and", "the", "for", "with", "that", "this", "into", "from",
  "must", "should", "will", "each", "every", "include", "includes",
  "contain", "contains", "deliverable", "items", "item", "your", "our",
  "have", "has", "are", "was", "were", "only", "than", "then", "they",
  "their", "them", "will", "any", "not", "no", "yes", "been", "being",
]);

function criterionKeywords(criterion) {
  return String(criterion)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

export function buildAgentDeliverable(bounty) {
  const criteria = String(bounty?.acceptanceCriteria || "").trim();
  const skills = (Array.isArray(bounty?.skills) ? bounty.skills : []).join(", ");

  const description = [
    `Completed by the BOUNTEA worker agent for "${bounty?.title || "this task"}".`,
    bounty?.description ? `Brief: ${bounty.description}` : "",
    bounty?.workInput ? `Work input provided: ${bounty.workInput}` : "",
    criteria
      ? `Acceptance criteria addressed: ${criteria}`
      : "Deliverable follows the task brief.",
    skills ? `Skills applied: ${skills}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: `Agent deliverable — ${bounty?.title || "task"}`,
    description,
    deliveryLink: `bountea://deliverables/${bounty?.id || "unknown"}`,
    notes:
      "Prepared autonomously by your worker agent after your go-ahead. " +
      "Preview only — payment is settled after client-agent review.",
  };
}

export function reviewSubmission({ bounty, submission, spendingCap }) {
  const reward = Number(bounty?.reward || 0);
  const withinCap =
    Number.isFinite(reward) && reward > 0 && (!spendingCap || reward <= spendingCap);
  const reasons = [];

  if (!withinCap) {
    reasons.push(`reward ${reward} USDC is above the ${spendingCap} USDC cap`);
  }
  if (!submission) {
    return { approved: false, withinCap, reasons: [...reasons, "no submission found"], passed: 0, checks: 0 };
  }

  const text = [
    submission.title,
    submission.description,
    submission.notes,
    submission.deliveryLink,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!text.trim()) {
    reasons.push("preview is empty");
  }

  const checks = String(bounty?.acceptanceCriteria || "")
    .split(/[,;\n]|\s+and\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({ label, keywords: criterionKeywords(label) }))
    .filter((check) => check.keywords.length > 0);

  const missing = checks.filter(
    (check) => !check.keywords.some((keyword) => text.includes(keyword)),
  );
  missing.forEach((check) => {
    reasons.push(`criteria not reflected: "${check.label}"`);
  });

  return {
    approved: withinCap && reasons.length === 0,
    withinCap,
    reasons,
    passed: checks.length - missing.length,
    checks: checks.length,
  };
}
