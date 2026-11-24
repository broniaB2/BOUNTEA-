import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";
import { BountyExplorer } from "./Marketplace";

function StatCard({ icon: Icon, tone, label, value, description }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div>
        <p>{label}</p>
        <h2>{value}</h2>
        <span>{description}</span>
      </div>
    </div>
  );
}

function HeroBanner({ onCreateBounty }) {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <span className="hero-tag">
          <Sparkles size={14} /> THE FUTURE OF WORK
        </span>
        <h2>
          Small tasks.
          <br />
          Bigger opportunities.
        </h2>
        <p>
          Connect businesses with skilled people and AI agents. Complete
          meaningful work and get paid through Stellar.
        </p>
        <button className="hero-button" onClick={onCreateBounty}>
          Post a bounty <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="hero-decoration">
        <div className="floating-card card-one">
          <Wallet size={19} />
          <div>
            <strong>USDC rewards</strong>
            <span>Stellar network</span>
          </div>
        </div>
        <div className="floating-card card-two">
          <CheckCircle2 size={19} />
          <div>
            <strong>Verified work</strong>
            <span>Transparent delivery</span>
          </div>
        </div>
        <div className="hero-circle">
          <Sparkles size={75} />
        </div>
      </div>
    </section>
  );
}

function Dashboard({
  bounties,
  filteredBounties,
  search,
  category,
  categories,
  submissions,
  onSearchChange,
  onCategoryChange,
  onCreateBounty,
  user,
  showBusinessActions,
}) {
  const isBusiness = user?.role === "business";

  // A bounty belongs to a business if created by them (email) OR posted under their name.
  const ownsBounty = (bounty) =>
    bounty.createdBy === user?.email || bounty.business === user?.name;

  const ownBounties = isBusiness ? bounties.filter(ownsBounty) : [];
  const openBounties = bounties.filter((bounty) => bounty.status === "OPEN");
  const claimedBounties = bounties.filter(
    (bounty) => bounty.claimedBy === user?.name,
  );
  const completedClaimed = claimedBounties.filter(
    (bounty) => bounty.status === "COMPLETED",
  );
  const totalEarnings = completedClaimed.reduce(
    (sum, bounty) => sum + Number(bounty.reward || 0),
    0,
  );
  const totalSpending = ownBounties
    .filter((bounty) => bounty.status === "COMPLETED")
    .reduce((sum, bounty) => sum + Number(bounty.reward || 0), 0);

  const ownedBountyIds = new Set(ownBounties.map((b) => String(b.id)));
  const submissionsReceived = (submissions || []).filter((submission) =>
    ownedBountyIds.has(String(submission.bountyId)),
  );

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">
            {isBusiness ? "YOUR BUSINESS HUB" : "YOUR OPPORTUNITY STARTS HERE"}
          </p>
          <h1>{isBusiness ? "Manage your bounties" : "Explore opportunities"}</h1>
          <p className="page-description">
            {isBusiness
              ? "Track the bounties you posted, review submissions and monitor your spending."
              : "Discover meaningful work, complete tasks and earn through autonomous payments on Stellar."}
          </p>
        </div>
        {showBusinessActions && (
          <button className="primary-button" onClick={onCreateBounty}>
            <Plus size={18} />
            Create bounty
          </button>
        )}
      </div>

      <section className="stats-grid">
        <StatCard
          icon={Compass}
          tone="purple"
          label={isBusiness ? "Your bounties" : "Available bounties"}
          value={isBusiness ? ownBounties.length : openBounties.length}
          description={isBusiness ? "Bounties you posted" : "Opportunities to explore"}
        />
        <StatCard
          icon={BriefcaseBusiness}
          tone="blue"
          label={isBusiness ? "Active (claimed)" : "Active tasks"}
          value={
            isBusiness
              ? ownBounties.filter((b) => b.status === "CLAIMED" || b.status === "IN_PROGRESS" || b.status === "SUBMITTED").length
              : claimedBounties.filter((bounty) => bounty.status === "IN_PROGRESS").length
          }
          description="Your ongoing work"
        />
        <StatCard
          icon={Wallet}
          tone="green"
          label={isBusiness ? "Total spending" : "Total earnings"}
          value={(isBusiness ? totalSpending : totalEarnings).toFixed(2)}
          description={isBusiness ? "USDC spent on completed tasks" : "USDC earned"}
        />
        <StatCard
          icon={CheckCircle2}
          tone="orange"
          label={isBusiness ? "Submissions received" : "Completed tasks"}
          value={isBusiness ? submissionsReceived.length : completedClaimed.length}
          description={isBusiness ? "Work awaiting or completed review" : "Successfully completed"}
        />
      </section>

      {showBusinessActions && <HeroBanner onCreateBounty={onCreateBounty} />}
      <BountyExplorer
        bounties={
          isBusiness
            ? filteredBounties.filter(ownsBounty)
            : filteredBounties
        }
        search={search}
        category={category}
        categories={categories}
        showViewAll
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
      />
      <footer className="footer">
        <span>© 2026 BOUNTEA</span>
        <span>Powered by opportunities. Built for everyone.</span>
      </footer>
    </div>
  );
}

export default Dashboard;
