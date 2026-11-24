import { ArrowUpRight, Clock3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function BountyCard({ bounty }) {
  const navigate = useNavigate();
  const location = useLocation();
  const statusLabel = bounty.status.replace(/_/g, " ");

  function openDetails() {
    navigate(`/marketplace/${bounty.id}`, {
      state: { from: location.pathname },
    });
  }

  return (
    <article className="bounty-card">
      <div className="bounty-card-top">
        <span className="category-tag">{bounty.category}</span>
        <span className={`status-tag status-${bounty.status.toLowerCase()}`}>
          {statusLabel}
        </span>
      </div>
      <h3>{bounty.title}</h3>
      <p className="bounty-description">{bounty.description}</p>
      <div className="skill-list">
        {(bounty.skills || []).map((skill) => (
          <span key={skill}>{skill}</span>
        ))}
      </div>
      <div className="bounty-business">
        <div className="business-avatar">{(bounty.business || "?").charAt(0)}</div>
        <span>{bounty.business}</span>
      </div>
      <div className="bounty-footer">
        <div className="reward">
          <strong>${Number(bounty.reward).toFixed(2)}</strong>
          <span>USDC</span>
        </div>
        <div className="deadline">
          <Clock3 size={15} />
          {bounty.deadline}
        </div>
      </div>
      <button
        className="view-button"
        onClick={openDetails}
      >
        View bounty <ArrowUpRight size={16} />
      </button>
    </article>
  );
}

export default BountyCard;
