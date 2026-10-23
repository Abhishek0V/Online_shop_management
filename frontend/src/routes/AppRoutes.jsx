import { Route, Routes } from "react-router-dom";
import GuestRoute from "../components/GuestRoute";
import ProtectedRoute from "../components/ProtectedRoute";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

// Temporary placeholders, replaced when the catalog and admin pages are built.
const Placeholder = ({ title }) => <div className="page-placeholder"><h1>{title}</h1></div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Placeholder title="Products (coming next)" />} />

      <Route element={<GuestRoute />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute roles={["customer"]} />}>
        <Route path="/cart" element={<Placeholder title="Cart (coming soon)" />} />
      </Route>
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route path="/admin" element={<Placeholder title="Admin dashboard (coming soon)" />} />
      </Route>

      <Route path="*" element={<Placeholder title="Page not found" />} />
    </Routes>
  );
}