import React from "react";
import "tailwindcss";
import Home from "./pages/Home";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import BillList from "./pages/BillList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "./redux/slices/authSlice";

const App = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/sales" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/sales" replace /> : <Register />
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/list"
          element={
            <ProtectedRoute>
              <BillList />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/sales" replace />} />
        <Route path="*" element={<Navigate to="/sales" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
