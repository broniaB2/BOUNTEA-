import { Plus, Search } from "lucide-react";
import BountyCard from "../components/bounties/BountyCard";

function BountyFilters({
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
}) {
  return (
    <div className="filter-row">
      <div className="search-box">
        <Search size={19} />
        <input
          type="text"
          placeholder="Search for tasks..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="category-filters">
        {categories.map((item) => (
          <button
            key={item}
            className={`filter-button ${
              category === item ? "selected" : ""
            }`}
            onClick={() => onCategoryChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BountyExplorer({
  bounties,
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
}) {
  return (
    <section className="marketplace-section">
      <div className="section-heading">
        <div>
          <h2>Discover bounties</h2>
          <p>Find tasks that match your skills.</p>
        </div>
      </div>
      <BountyFilters
        search={search}
        category={category}
        categories={categories}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
      />
      <div className="bounty-grid">
        {bounties.map((bounty) => (
          <BountyCard bounty={bounty} key={bounty.id} />
        ))}
      </div>
      {bounties.length === 0 && (
        <div className="empty-state">
          <Search size={35} />
          <h3>No bounties found</h3>
          <p>Try another search term or category.</p>
        </div>
      )}
    </section>
  );
}

function Marketplace({
  filteredBounties,
  search,
  category,
  categories,
  onSearchChange,
  onCategoryChange,
  onCreateBounty,
  user,
}) {
  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">YOUR OPPORTUNITY STARTS HERE</p>
          <h1>Explore opportunities</h1>
          <p className="page-description">
            Discover meaningful work, complete tasks and earn through
            autonomous payments on Stellar.
          </p>
        </div>
        {user?.role === "business" && (
          <button className="primary-button" onClick={onCreateBounty}>
            <Plus size={18} />
            Create bounty
          </button>
        )}
      </div>
      <BountyExplorer
        bounties={filteredBounties}
        search={search}
        category={category}
        categories={categories}
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

export default Marketplace;
