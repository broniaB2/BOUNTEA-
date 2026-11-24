import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function MainLayout({ user, onLogout, onCreateBounty }) {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        mobileMenu={mobileMenu}
        onClose={() => setMobileMenu(false)}
        onCreateBounty={onCreateBounty}
        user={user}
        onLogout={onLogout}
      />
      <main className="main-content">
        <Topbar onOpenMenu={() => setMobileMenu(true)} user={user} onLogout={onLogout} />
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
