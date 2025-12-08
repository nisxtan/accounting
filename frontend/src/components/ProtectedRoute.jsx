import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuthenticated,
  selectHydrated,
} from "../redux/slices/authSlice";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const hydrated = useSelector(selectHydrated);

  // Wait until Redux Persist finishes restoring state
  if (!hydrated) {
    return <div className="text-center mt-10 text-gray-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
