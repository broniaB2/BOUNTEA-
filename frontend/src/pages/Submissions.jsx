import { useEffect, useMemo, useRef, useState } from "react";
import { reviewSubmission } from "../services/agentService";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquare,
  X,
} from "lucide-react";

const filters = [
  { label: "All Submissions", value: "ALL" },
  { label: "Awaiting Review", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Revision Requested", value: "REVISION_REQUESTED" },
];

function formatStatus(status) {
  return status.replace(/_/g, " ");
}

function getStatusLabel(status) {
  return status === "APPROVED"
    ? "APPROVED — Awaiting Payment"
    : formatStatus(status);
}

function SubmissionDetails({
  submission,
  bounty,
  onApprove,
  onApproveAndPay,
  spendingCap,
  onRequestRevision,
  onClose,
}) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);
  const [paying, setPaying] = useState(false);
  const canReview = submission.status === "SUBMITTED";
  const withinCap =
    !spendingCap || Number(bounty?.reward || submission.reward || 0) <= spendingCap;

  function handleRevision(event) {
    event.preventDefault();
    const result = onRequestRevision(submission.id, feedback);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setFeedback("");
    setError("");
  }

  async function handleApproval() {
    if (!withinCap) {
      setError(`Reward exceeds spending cap of ${spendingCap} USDC.`);
      return;
    }
    setError("");
    setPaying(true);
    setPaymentResult(null);
    try {
      if (onApproveAndPay) {
        const result = await onApproveAndPay(submission.id);
        if (!result || !result.success) {
          setError((result && result.error) || "Payment failed");
          return;
        }
        setPaymentResult(result.receipt || result);
      } else {
        const result = onApprove(submission.id);
        if (!result.success) setError(result.error);
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="submission-details">
      <div className="submission-details-header">
        <div>
          <p className="eyebrow">SUBMISSION REVIEW</p>
          <h2>{submission.title || "Untitled submission"}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close submission">
          <X size={18} />
        </button>
      </div>
      <div className="submission-detail-grid">
        <div>
          <span>Related bounty</span>
          <strong>{bounty?.title || "Unknown bounty"}</strong>
        </div>
        <div>
          <span>Worker</span>
          <strong>{submission.workerName || "Unknown worker"}</strong>
        </div>
        <div>
          <span>Business / client</span>
          <strong>{submission.clientName || bounty?.business || "Unknown client"}</strong>
        </div>
        <div>
          <span>Submitted</span>
          <strong>{submission.submittedAt || "Date not provided"}</strong>
        </div>
        <div>
          <span>Reward</span>
          <strong>${Number(bounty?.reward || submission.reward || 0).toFixed(2)} USDC</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>
            <span className={`status-tag status-${submission.status.toLowerCase()}`}>
              {getStatusLabel(submission.status)}
            </span>
          </strong>
        </div>
      </div>
      <div className="submission-content">
        <h3>Description</h3>
        <p>{submission.description || "No description provided."}</p>
        {submission.deliveryLink && (
          <p>
            <strong>Delivery link: </strong>
            <a href={submission.deliveryLink} target="_blank" rel="noreferrer">
              Open delivery <ExternalLink size={13} />
            </a>
          </p>
        )}
        {submission.notes && (
          <p>
            <strong>Additional notes: </strong>
            {submission.notes}
          </p>
        )}
        {submission.revisionFeedback && (
          <div className="revision-feedback">
            <strong>Revision feedback</strong>
            <p>{submission.revisionFeedback}</p>
          </div>
        )}
      </div>
      {bounty?.acceptanceCriteria && (
        <div className="review-instructions">
          <strong>Client agent review instructions</strong>
          <p>{bounty.acceptanceCriteria}</p>
        </div>
      )}
      {!withinCap && (
        <div className="cap-warning">
          ⚠ Reward exceeds the spending cap ({spendingCap} USDC) — human intervention
          required. Auto-approve is disabled for this submission.
        </div>
      )}
      {canReview && (
        <div className="review-actions">
          <div className="cap-check">
            <strong>Client agent cap check</strong>
            <span className={withinCap ? "cap-ok" : "cap-bad"}>
              Reward ${Number(bounty?.reward || submission.reward || 0).toFixed(2)} USDC
              {withinCap
                ? ` ≤ cap ${spendingCap} USDC — approved to pay`
                : ` exceeds cap ${spendingCap} USDC`}
            </span>
          </div>
          <button
            className="primary-button"
            onClick={handleApproval}
            disabled={paying || !withinCap}
          >
            <CheckCircle2 size={17} />
            {paying ? "Settling via x402…" : "Approve & Pay via x402"}
          </button>
          <form onSubmit={handleRevision} className="revision-form">
            <label htmlFor={`feedback-${submission.id}`}>Revision feedback</label>
            <textarea
              id={`feedback-${submission.id}`}
              required
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                setError("");
              }}
              placeholder="Explain what needs improvement..."
            />
            <button type="submit" className="secondary-button">
              <MessageSquare size={16} />
              Request Revision
            </button>
          </form>
        </div>
      )}
      {paymentResult && paymentResult.txHash && (
        <div className="payment-receipt">
          <div className="payment-receipt-header">
            <CheckCircle2 size={18} />
            <strong>Paid on Stellar Testnet via x402</strong>
          </div>
          <div className="payment-receipt-body">
            <span>Transaction hash</span>
            <code>{paymentResult.txHash}</code>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${paymentResult.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Stellar Explorer <ExternalLink size={13} />
            </a>
          </div>
        </div>
      )}
      {submission.status === "APPROVED" && !paymentResult && (
        <div className="approval-notice">
          Work approved — awaiting payment. Payment confirmation will appear after
          backend verification.
        </div>
      )}
      {error && <div className="review-error">{error}</div>}
    </div>
  );
}

function Submissions({
  bounties,
  submissions,
  user,
  spendingCap,
  backendOnline,
  onApproveSubmission,
  onApproveAndPay,
  onRequestRevision,
}) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");
  const [autoApprove, setAutoApprove] = useState(() => {
    try {
      return window.localStorage.getItem("bountea.autoApprove") !== "false";
    } catch {
      return true;
    }
  });
  const [agentLog, setAgentLog] = useState([]);
  const processedRef = useRef(new Set());
  const ownedBountyIds = new Set(
    bounties
      .filter(
        (bounty) =>
          bounty.createdBy === user?.email || bounty.business === user?.name,
      )
      .map((bounty) => String(bounty.id)),
  );
  const scopedSubmissions = submissions.filter((submission) =>
    ownedBountyIds.has(String(submission.bountyId)),
  );
  const visibleSubmissions = useMemo(
    () =>
      scopedSubmissions.filter(
        (submission) =>
          activeFilter === "ALL" || submission.status === activeFilter,
      ),
    [scopedSubmissions, activeFilter],
  );
  useEffect(() => {
    try {
      window.localStorage.setItem("bountea.autoApprove", String(autoApprove));
    } catch {
      // ignore
    }
  }, [autoApprove]);

  const selectedSubmission = scopedSubmissions.find(
    (item) => item.id === selectedId,
  );
  const selectedBounty = bounties.find(
    (bounty) => String(bounty.id) === String(selectedSubmission?.bountyId),
  );

  // Client agent: review against the brief + cap, then approve and pay.
  // Real x402 settlement is required — never auto-approve through the offline mock fallback.
  useEffect(() => {
    if (!autoApprove || !backendOnline || !onApproveAndPay) return;
    scopedSubmissions
      .filter((s) => s.status === "SUBMITTED")
      .forEach((submission) => {
        const bounty = bounties.find(
          (b) => String(b.id) === String(submission.bountyId),
        );
        // Key includes the preview content so a human-edited resubmission is re-reviewed.
        const key = `${submission.id}|${submission.description || ""}|${submission.status}`;
        if (processedRef.current.has(key)) return;
        processedRef.current.add(key);

        const review = reviewSubmission({ bounty, submission, spendingCap });

        if (!review.withinCap) {
          setAgentLog((prev) => [
            `⚠ Client agent held "${submission.title}": ${review.reasons.join("; ")} — human intervention required.`,
            ...prev,
          ]);
          return;
        }
        if (!review.approved) {
          setAgentLog((prev) => [
            `✗ Client agent did not approve "${submission.title}": ${review.reasons.join("; ")} — human review needed.`,
            ...prev,
          ]);
          return;
        }

        const criteriaSummary = review.checks
          ? ` (${review.passed}/${review.checks} acceptance checks passed)`
          : "";
        setAgentLog((prev) => [
          `✓ Client agent reviewed "${submission.title}"${criteriaSummary} — reward ${bounty.reward} ≤ ${spendingCap} cap. Settling x402 payment…`,
          ...prev,
        ]);
        onApproveAndPay(submission.id)
          .then((result) => {
            if (result && result.success === false) {
              setAgentLog((prev) => [
                `✗ Payment failed for "${submission.title}": ${result.error || "unknown error"}. Human review needed.`,
                ...prev,
              ]);
            } else {
              setAgentLog((prev) => [
                `✓ Client agent paid "${submission.title}" via x402 — receipt available.`,
                ...prev,
              ]);
            }
          })
          .catch((error) => {
            setAgentLog((prev) => [
              `✗ Payment failed for "${submission.title}": ${error?.message || "unknown error"}. Human review needed.`,
              ...prev,
            ]);
          });
      });
  }, [scopedSubmissions, autoApprove, backendOnline, bounties, spendingCap, onApproveAndPay]);

  function handleApprove(submissionId) {
    const result = onApproveSubmission(submissionId);
    if (result.success) {
      setNotice("Submission approved. Payment remains awaiting backend confirmation.");
    }
    return result;
  }

  function handleRevision(submissionId, feedback) {
    const result = onRequestRevision(submissionId, feedback);
    if (result.success) {
      setNotice("Revision requested. The worker can now update and resubmit this work.");
    }
    return result;
  }

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">CLIENT WORKSPACE</p>
          <h1>Submissions</h1>
          <p className="page-description">
            Review submitted work and follow its verification status.
          </p>
        </div>
      </div>
      <div className="task-filters" role="group" aria-label="Submission status filters">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`filter-button ${
              activeFilter === filter.value ? "selected" : ""
            }`}
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="agent-panel">
        <label className="agent-toggle">
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={(e) => setAutoApprove(e.target.checked)}
          />
          <span>
            <strong>Client agent auto-approve</strong> — reviews each preview against
            the task's acceptance criteria, then approves and settles a real x402
            payment when the reward is within the {spendingCap} USDC cap. Above-cap
            tasks, failed reviews and offline backends require human intervention.
          </span>
        </label>
        {agentLog.length > 0 && (
          <div className="agent-log">
            {agentLog.slice(0, 6).map((entry, idx) => (
              <div key={idx} className="agent-log-entry">
                {entry}
              </div>
            ))}
          </div>
        )}
      </div>
      {notice && <div className="task-notice">{notice}</div>}
      {visibleSubmissions.length === 0 ? (
        <div className="empty-state">
          <FileText size={35} />
          <h3>No submissions in this view</h3>
          <p>Submitted work and review updates will appear here.</p>
        </div>
      ) : (
        <div className="submission-list">
          {visibleSubmissions.map((submission) => {
            const bounty = bounties.find(
              (item) => String(item.id) === String(submission.bountyId),
            );
            return (
              <article className="submission-card" key={submission.id}>
                <div>
                  <div className="bounty-card-top">
                    <span className="category-tag">{bounty?.category || "Work"}</span>
                    <span
                      className={`status-tag status-${submission.status.toLowerCase()}`}
                    >
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>
                  <h2>{submission.title || "Untitled submission"}</h2>
                  <p className="bounty-description">
                    {bounty?.title || "Related bounty unavailable"}
                  </p>
                  <div className="task-meta">
                    <span>{submission.workerName || "Worker not provided"}</span>
                    <span>
                      ${Number(bounty?.reward || submission.reward || 0).toFixed(2)} USDC
                    </span>
                    <span>{submission.submittedAt || "Date not provided"}</span>
                  </div>
                </div>
                <button
                  className="view-button"
                  onClick={() => setSelectedId(submission.id)}
                >
                  Review submission
                </button>
              </article>
            );
          })}
        </div>
      )}
      {selectedSubmission && (
        <SubmissionDetails
          submission={selectedSubmission}
          bounty={selectedBounty}
          spendingCap={spendingCap}
          onApprove={handleApprove}
          onApproveAndPay={onApproveAndPay}
          onRequestRevision={handleRevision}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

export default Submissions;
