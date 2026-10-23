import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

// Login/register pages are not for people who are already logged in.
export default function GuestRoute() {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <Loader />;
  if (user) return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  return <Outlet />;
}