import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdminAuth } from "../hooks/use-admin-auth";

export function AdminDashboard() {
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/admin/login" });
    } else {
      navigate({ to: "/admin/submissions" });
    }
  }, [isAuthenticated, navigate]);

  return null;
}
