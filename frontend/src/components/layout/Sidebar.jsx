import {
  BriefcaseBusiness,
  Compass,
  FileText,
  LayoutDashboard,
  Plus,
  Receipt,
  Sparkles,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Marketplace", path: "/marketplace", icon: Compass },
  { label: "My Tasks", path: "/my-tasks", icon: BriefcaseBusiness },
  { label: "Submissions", path: "/submissions", icon: FileText },
  { label: "Receipts", path: "/receipts", icon: Receipt },
];

function Sidebar({ mobileMenu, onClose, onCreateBounty, user, onLogout }) {
  const isBusiness = user?.role === "business";
  return (
    <aside className={`sidebar ${mobileMenu ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <Sparkles size={23} />
        </div>
        <div>
          <h2>BOUNTEA</h2>
          <span>Work. Earn. Grow.</span>
        </div>
        <button className="mobile-close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">WORKSPACE</p>
        {navigation
          .filter(({ label }) => label !== "My Tasks" || !isBusiness)
          .filter(({ label }) => label !== "Submissions" || isBusiness)
          .map(({ label, path, icon: Icon }) => (
          <NavLink
            key={label}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
            onClick={onClose}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {isBusiness && (
        <div className="sidebar-section">
          <p className="sidebar-label">BUSINESS</p>
          <button className="nav-link" onClick={onCreateBounty}>
            <Plus size={19} />
            <span>Create Bounty</span>
          </button>
        </div>
      )}

      <div className="sidebar-bottom">
        <div className="help-card">
          <Sparkles size={20} />
          <h4>Have a task to complete?</h4>
          <p>Discover opportunities and turn your skills into income.</p>
        </div>
        <div className="profile">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{isBusiness ? "Business Account" : "Worker Account"}</span>
          </div>
        </div>
        <button className="logout-button" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}

export default Sidebar;
