import { Navigate } from "react-router-dom";

function GuestRoute({ user, children }) {
  return user ? <Navigate to="/" replace /> : children;
}

export default GuestRoute;
