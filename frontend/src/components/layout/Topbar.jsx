import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

function Topbar({ onOpenMenu, user }) {
  const location = useLocation();
  const pageName =
    location.pathname === "/"
      ? "Dashboard"
      : location.pathname
          .slice(1)
          .split("-")
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join(" ");

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onOpenMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>
      <div className="breadcrumb">
        Workspace <span>/</span> {pageName}
      </div>
      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot"></span>
        </button>
        <div className="topbar-profile">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <span>{user?.name}</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
