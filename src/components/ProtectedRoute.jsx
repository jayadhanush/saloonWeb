import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, role, children }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If route requires owner access but user is not an owner, redirect
  if (role === "owner" && user.role !== "owner") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
