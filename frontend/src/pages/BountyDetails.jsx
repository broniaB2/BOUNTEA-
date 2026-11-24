import { useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Users,
  Wallet,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function DetailItem({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="bounty-detail-item">
      <Icon size={17} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function BountyDetails({ bounties, onClaimBounty, canClaim = true }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bounty = bounties.find((item) => String(item.id) === String(id));
  const [claimMessage, setClaimMessage] = useState("");

  if (!bounty) {
    return (
      <div className="page-content">
        <div className="details-state">
          <h1>Bounty not found</h1>
          <p>The bounty may have been removed or is no longer available.</p>
          <button
            className="primary-button"
            onClick={() => navigate("/marketplace")}
          >
            <ArrowLeft size={17} />
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const canClaimBounty = canClaim && bounty.status === "OPEN";
  const statusLabel = bounty.status.replace(/_/g, " ");

  function handleClaim() {
    const result = onClaimBounty(bounty.id);
    setClaimMessage(
      result.success ? "Bounty claimed successfully." : result.error,
    );
  }

  return (
    <div className="page-content">
      <button
        className="back-button"
        onClick={() => navigate(location.state?.from || "/marketplace")}
      >
        <ArrowLeft size={17} />
        Back to Marketplace
      </button>

      <div className="details-layout">
        <article className="bounty-details-card">
          <div className="details-header">
            <div>
              <span className="category-tag">{bounty.category}</span>
              <h1>{bounty.title}</h1>
              <div className="details-business">
                <div className="business-avatar">{(bounty.business || "?").charAt(0)}</div>
                <span>{bounty.business}</span>
              </div>
            </div>
            <span className={`status-tag status-${bounty.status.toLowerCase()}`}>
              {statusLabel}
            </span>
          </div>

          <section className="details-section">
            <h2>About this bounty</h2>
            <p>{bounty.description}</p>
          </section>

          {bounty.instructions && (
            <section className="details-section">
              <h2>Client instructions</h2>
              <p>{bounty.instructions}</p>
            </section>
          )}

          <section className="details-section">
            <h2>Required skills</h2>
            <div className="skill-list">
              {(bounty.skills || []).map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>
        </article>

        <aside className="details-sidebar">
          <div className="details-reward-card">
            <span>Reward</span>
            <strong>${Number(bounty.reward).toFixed(2)}</strong>
            <small>USDC</small>
            {bounty.network && (
              <div className="details-network">
                <Wallet size={16} />
                {bounty.network}
              </div>
            )}
          </div>

          <div className="details-info-card">
            <DetailItem icon={Clock3} label="Deadline" value={bounty.deadline} />
            <DetailItem
              icon={CalendarDays}
              label="Created"
              value={bounty.createdAt}
            />
            <DetailItem
              icon={Users}
              label="Applicants"
              value={bounty.applicants}
            />
            <DetailItem
              icon={BriefcaseBusiness}
              label="Claimed by"
              value={bounty.claimedBy}
            />
          </div>

          {canClaimBounty ? (
            <button className="primary-button claim-button" onClick={handleClaim}>
              <CheckCircle2 size={18} />
              Claim Bounty
            </button>
          ) : (
            <div className="unavailable-message">
              {canClaim
                ? "This bounty is not available for claiming."
                : "Business accounts can view bounty details but cannot claim work."}
            </div>
          )}
          {claimMessage && <div className="claim-message">{claimMessage}</div>}
        </aside>
      </div>
    </div>
  );
}

export default BountyDetails;