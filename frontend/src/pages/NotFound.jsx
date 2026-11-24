import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page-content">
      <div className="empty-state">
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link className="primary-button" to="/">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
