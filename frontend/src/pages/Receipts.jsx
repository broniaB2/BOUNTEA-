import { useMemo } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Receipt,
  Wallet,
} from "lucide-react";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet/tx";

function ReceiptCard({ receipt, bounty }) {
  const explorerUrl = `${EXPLORER_BASE}/${receipt.txHash}`;
  return (
    <article className="receipt-card">
      <div className="receipt-card-header">
        <div className="receipt-icon">
          <Receipt size={22} />
        </div>
        <div>
          <p className="eyebrow">PORTABLE PROOF OF WORK</p>
          <h2>{receipt.taskTitle || "Paid task"}</h2>
          <span className="receipt-id">Receipt #{receipt.id}</span>
        </div>
        <span className="receipt-status">
          <CheckCircle2 size={16} /> Settled on Stellar
        </span>
      </div>

      <div className="receipt-grid">
        <div>
          <span>Amount paid</span>
          <strong>${Number(receipt.amount).toFixed(2)} USDC</strong>
        </div>
        <div>
          <span>Network</span>
          <strong>{receipt.network}</strong>
        </div>
        <div>
          <span>Payer (client agent)</span>
          <strong className="mono">{receipt.payer?.slice(0, 8)}…{receipt.payer?.slice(-6)}</strong>
        </div>
        <div>
          <span>Recipient (worker)</span>
          <strong className="mono">{receipt.recipient?.slice(0, 8)}…{receipt.recipient?.slice(-6)}</strong>
        </div>
        <div>
          <span>Settled at</span>
          <strong>{new Date(receipt.settledAt).toLocaleString()}</strong>
        </div>
        <div>
          <span>Related bounty</span>
          <strong>{bounty?.title || receipt.taskTitle || "—"}</strong>
        </div>
      </div>

      <div className="receipt-tx">
        <div>
          <span>Transaction hash</span>
          <code>{receipt.txHash}</code>
        </div>
        <a
          className="receipt-explorer-link"
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on Stellar Explorer <ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}

function Receipts({ receipts, bounties, backendOnline }) {
  const enriched = useMemo(
    () =>
      (receipts || []).map((receipt) => ({
        receipt,
        bounty: (bounties || []).find((b) => String(b.id) === String(receipt.taskId)),
      })),
    [receipts, bounties],
  );

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">PROOF OF WORK</p>
          <h1>Receipts</h1>
          <p className="page-description">
            Every completed task, settled on Stellar Testnet via x402. Each receipt
            carries a live transaction hash you can verify on-chain.
          </p>
        </div>
        <div className="receipt-summary">
          <Wallet size={18} />
          <span>{enriched.length} settled payment{enriched.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {!backendOnline && (
        <div className="task-notice">
          Backend offline — showing cached receipts. Start the backend to settle new payments.
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="empty-state">
          <Receipt size={35} />
          <h3>No receipts yet</h3>
          <p>
            Approve a submitted task from the Submissions page to trigger an x402
            payment and generate your first on-chain receipt.
          </p>
        </div>
      ) : (
        <div className="receipt-list">
          {enriched.map(({ receipt, bounty }) => (
            <ReceiptCard key={receipt.id} receipt={receipt} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Receipts;