// BOUNTEA backend — protected deliverable endpoint settled via Stellar x402 (testnet).
//
// Run:  cd backend && npm run dev   (after `npm run setup`)
// Health: http://localhost:4021/api/health

import "dotenv/config";
import express from "express";
import cors from "cors";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme as ExactStellarClientScheme } from "@x402/stellar/exact/client";

const NETWORK = process.env.STELLAR_NETWORK || "stellar:testnet";
const PORT = process.env.PORT || 4021;
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://x402.org/facilitator";
const SPENDING_CAP = Number(process.env.SPENDING_CAP_USDC || 12);

// ---------- In-memory state ----------
const tasks = [
  {
    id: "task-1",
    title: "Translate 20 product listings into Luganda",
    description: "Translate 20 craft product listings for Neema's shop. Deliverable: translated text file.",
    category: "Translation",
    reward: 2,
    deadline: "3 days",
    business: "Neema Crafts",
    createdBy: "neema@example.com",
    skills: ["Translation", "Luganda"],
    network: "Stellar Testnet",
    status: "OPEN",
    claimedBy: null,
    preview: null,
  },
  {
    id: "task-2",
    title: "Clean and organise sales records",
    description: "Organise monthly sales records into a structured spreadsheet.",
    category: "Data",
    reward: 5,
    deadline: "5 days",
    business: "Mirembe Stores",
    createdBy: "mirembe@example.com",
    skills: ["Excel", "Data Entry"],
    network: "Stellar Testnet",
    status: "OPEN",
    claimedBy: null,
    preview: null,
  },
];
const receipts = []; // { id, taskId, txHash, payer, network, amount, settledAt }
const lastTxByTask = new Map(); // taskId -> txHash (captured in afterSettle hook)

function getTask(id) {
  return tasks.find((t) => String(t.id) === String(id));
}

function resolveRecipient() {
  const raw = (process.env.STELLAR_RECIPIENT || "").trim().replace(/['"]/g, "");
  if (!raw) return "";
  if (raw.startsWith("S")) {
    try {
      return Keypair.fromSecret(raw).publicKey();
    } catch {
      return "";
    }
  }
  if (!StrKey.isValidEd25519PublicKey(raw)) return "";
  return raw;
}

const PAY_TO = resolveRecipient();

// ---------- x402 server ----------
const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitator).register(
  NETWORK,
  new ExactStellarScheme(),
);

// Capture tx hash on settle for the receipts store.
resourceServer.onAfterSettle(async (ctx) => {
  try {
    const tx = ctx.result?.transaction;
    const tc = ctx.transportContext;
    const path = tc?.request?.path || "";
    const id = path.split("/").filter(Boolean).pop();
    if (id && tx) lastTxByTask.set(id, tx);
    console.log(`[x402] settled task=${id} tx=${tx}`);
  } catch (e) {
    console.error("[x402] afterSettle hook error:", e);
  }
});

const routes = {
  "GET /deliverable/:id": {
    accepts: {
      scheme: "exact",
      // Dynamic price: look up the task reward from the in-memory store.
      price: (context) => {
        const id = (context.path || "").split("/").filter(Boolean).pop();
        const task = getTask(id);
        const amount = task ? Number(task.reward) : 1;
        return `$${amount.toFixed(2)}`;
      },
      network: NETWORK,
      payTo: PAY_TO,
    },
    description: "Full deliverable release (x402-gated)",
  },
};

let x402Middleware;
if (PAY_TO) {
  x402Middleware = paymentMiddleware(routes, resourceServer);
} else {
  console.warn("STELLAR_RECIPIENT missing/invalid — paid routes return 503");
  x402Middleware = (_req, res) => res.status(503).json({ error: "x402 unavailable" });
}

// ---------- Express app ----------
const app = express();
app.use(cors());
app.use(express.json());

// Health / config
app.get("/", (_req, res) => res.json({ ok: true, service: "bountea-backend", network: NETWORK }));
app.get("/api/health", (_req, res) => res.json({ ok: true, network: NETWORK }));
app.get("/api/config", (_req, res) =>
  res.json({ spendingCap: SPENDING_CAP, network: NETWORK, facilitator: FACILITATOR_URL })
);

// Tasks
app.get("/api/tasks", (_req, res) => res.json(tasks));
app.get("/api/tasks/:id", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  res.json(t);
});
app.post("/api/tasks", (req, res) => {
  const body = req.body || {};
  const { title, description, category, reward, deadline, business, acceptanceCriteria } = body;
  const skills = Array.isArray(body.skills) && body.skills.length
    ? body.skills
    : [category || "General"];
  const r = Number(reward);
  if (!title || !Number.isFinite(r) || r <= 0 || r > SPENDING_CAP) {
    return res.status(400).json({ error: `reward must be >0 and <= ${SPENDING_CAP}` });
  }
  const t = {
    id: `task-${Date.now()}`,
    title,
    description: description || "",
    category: category || "General",
    reward: r,
    deadline: deadline || "3 days",
    business: business || "Your Business",
    createdBy: (req.body && req.body.createdBy) || business || "demo@bountea.app",
    skills,
    acceptanceCriteria: acceptanceCriteria || "",
    network: "Stellar Testnet",
    status: "OPEN",
    claimedBy: null,
    preview: null,
  };
  tasks.unshift(t);
  res.status(201).json(t);
});
app.post("/api/tasks/:id/claim", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  if (t.status !== "OPEN") return res.status(400).json({ error: "not claimable" });
  t.status = "CLAIMED";
  t.claimedBy = req.body?.worker || "worker-agent";
  res.json(t);
});
app.post("/api/tasks/:id/preview", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  const body = req.body || {};
  const {
    title,
    description,
    deliveryLink,
    notes,
    worker,
    isRevision,
  } = body;

  const previewText =
    body.preview ||
    [title, description, deliveryLink, notes].filter(Boolean).join(" | ");

  // Resubmission path: only when a revision was requested.
  if (
    isRevision &&
    t.submission &&
    t.submission.status === "REVISION_REQUESTED" &&
    t.status === "IN_PROGRESS"
  ) {
    t.submission = {
      ...t.submission,
      title: title || t.submission.title,
      description: description || t.submission.description,
      deliveryLink: deliveryLink || t.submission.deliveryLink,
      notes: notes || t.submission.notes,
      status: "SUBMITTED",
      submittedAt: new Date().toLocaleDateString(),
      revisionFeedback: "",
      paymentStatus: "NOT_STARTED",
    };
    t.preview = previewText;
    t.status = "SUBMITTED";
    return res.json(t);
  }

  // Fresh submission.
  if (t.status !== "CLAIMED" && t.status !== "IN_PROGRESS") {
    // Allow re-submission only in the revision flow above; otherwise require claimed/in-progress.
    if (t.status !== "SUBMITTED") {
      return res.status(400).json({ error: "task not ready for submission" });
    }
  }

  t.submission = {
    id: `submission-${Date.now()}`,
    bountyId: t.id,
    workerName: worker || t.claimedBy || "worker-agent",
    clientName: t.business,
    submittedAt: new Date().toLocaleDateString(),
    title: title || "",
    description: description || "",
    deliveryLink: deliveryLink || "",
    notes: notes || "",
    status: "SUBMITTED",
    paymentStatus: "NOT_STARTED",
    revisionFeedback: "",
  };
  t.preview = previewText;
  t.status = "SUBMITTED";
  res.json(t);
});
app.get("/api/tasks/:id/preview", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  res.json({ preview: t.preview, status: t.status, submission: t.submission || null });
});

// Client agent requests a revision: task goes back to in-progress, submission marked REVISION_REQUESTED.
app.post("/api/tasks/:id/revision", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });
  const { feedback } = req.body || {};
  if (!feedback || !String(feedback).trim()) {
    return res.status(400).json({ error: "revision feedback is required" });
  }
  if (!t.submission || t.submission.status !== "SUBMITTED") {
    return res.status(400).json({ error: "only submitted work can be revised" });
  }
  t.submission = {
    ...t.submission,
    status: "REVISION_REQUESTED",
    revisionFeedback: String(feedback).trim(),
    paymentStatus: "NOT_STARTED",
  };
  t.preview = t.submission
    ? [t.submission.title, t.submission.description].filter(Boolean).join(" | ")
    : t.preview;
  t.status = "IN_PROGRESS";
  res.json(t);
});

// Client agent: cap check + preview check + real x402 payment + receipt
app.post("/api/tasks/:id/approve", async (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "not found" });

  // 1) Preview check (must exist)
  if (!t.preview || !String(t.preview).trim()) {
    return res.status(400).json({ error: "no preview submitted yet" });
  }
  // 2) Cap check (Neema's rule)
  if (Number(t.reward) > SPENDING_CAP) {
    return res.status(400).json({ error: `reward ${t.reward} exceeds cap ${SPENDING_CAP}` });
  }

  // 3) Pay via x402 buyer (server-side client agent)
  const payerSecret = process.env.STELLAR_SECRET_KEY;
  if (!PAY_TO || !payerSecret) {
    return res.status(500).json({ error: "payer/recipient not configured" });
  }
  const signer = createEd25519Signer(payerSecret, NETWORK);
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: NETWORK, client: new ExactStellarClientScheme(signer) }],
    // Neema's spending cap is enforced server-side (SPENDING_CAP); mirror it here
    // so the client agent refuses anything above the cap too.
    spendControls: { maxAmountPerPayment: SPENDING_CAP },
  });

  let txHash = null;
  try {
    const payRes = await fetchWithPayment(`http://localhost:${PORT}/deliverable/${t.id}`);
    const body = await payRes.json().catch(() => ({}));
    // tx hash may be in payment-response header (base64) or body
    const prHeader = payRes.headers.get("payment-response") || payRes.headers.get("PAYMENT-RESPONSE");
    if (prHeader) {
      try {
        const decoded = JSON.parse(Buffer.from(prHeader, "base64").toString("utf8"));
        txHash = decoded.transaction || decoded.txHash || null;
      } catch {}
    }
    if (!txHash) txHash = lastTxByTask.get(String(t.id)) || body.txHash || null;
    if (!payRes.ok) {
      return res.status(502).json({ error: "payment failed", detail: body });
    }
  } catch (e) {
    return res.status(502).json({ error: "payment error", detail: String(e) });
  }

  // 4) Record receipt
  const receipt = {
    id: `rcpt-${Date.now()}`,
    taskId: t.id,
    taskTitle: t.title,
    amount: Number(t.reward),
    network: NETWORK,
    txHash: txHash || "pending",
    payer: process.env.STELLAR_PAYER_PUBLIC || "payer",
    recipient: PAY_TO,
    settledAt: new Date().toISOString(),
  };
  receipts.unshift(receipt);
  t.status = "COMPLETED";
  t.txHash = receipt.txHash;
  if (t.submission) {
    t.submission = { ...t.submission, status: "APPROVED", paymentStatus: "AWAITING_PAYMENT" };
  }

  res.json({ success: true, receipt, task: t });
});

// Receipts
app.get("/api/receipts", (_req, res) => res.json(receipts));
app.get("/api/receipts/:id", (req, res) => {
  const r = receipts.find((x) => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "not found" });
  res.json(r);
});

// Protected deliverable endpoint (x402-gated)
app.get("/deliverable/:id", x402Middleware, (req, res) => {
  const t = getTask(req.params.id);
  res.json({
    ok: true,
    taskId: req.params.id,
    title: t?.title || "deliverable",
    fullDeliverable: `FULL DELIVERABLE for ${t?.title || req.params.id}: [complete translated listings / full file content released after payment]`,
    txHash: lastTxByTask.get(String(req.params.id)) || null,
  });
});

app.listen(PORT, () => {
  console.log(`BOUNTEA backend listening on port ${PORT} (${NETWORK})`);
  console.log(`Recipient (payTo): ${PAY_TO || "(not configured)"}`);
  if (!PAY_TO) console.warn("⚠ STELLAR_RECIPIENT not configured — paid routes return 503");
});
