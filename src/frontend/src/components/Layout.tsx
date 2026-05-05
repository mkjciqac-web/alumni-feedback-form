import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  GraduationCap,
  LayoutDashboard,
  List,
  Lock,
  LogOut,
  Settings,
} from "lucide-react";
import { useAdminAuth } from "../hooks/use-admin-auth";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-card border-b border-border shadow-xs sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-foreground text-base leading-tight">
              Alumni Feedback Form
            </h1>
            <p className="text-xs text-muted-foreground">
              Share your learning experience
            </p>
          </div>
          <Link to="/admin/login">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs shrink-0"
              data-ocid="header.admin_login_button"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Login
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center py-8 px-4">
        {children}
      </main>
      <footer className="bg-card border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Marudhar Kesari Jain College for Women
        (Autonomous), Vaniyambadi
      </footer>
    </div>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/submissions", label: "Submissions", icon: List },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const handleLogout = () => {
    logout();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-primary text-primary-foreground border-b border-primary/20 shadow-xs sticky top-0 z-20 h-14 flex items-center">
        <div className="flex items-center w-full px-4 gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <span className="font-display font-bold text-sm">
              Alumni Feedback Form
            </span>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200"
            data-ocid="admin.logout_button"
          >
            <LogOut className="w-4 h-4" />
            Admin – Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
          <nav className="flex-1 py-4 px-3 space-y-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const isActive =
                currentPath === to ||
                (to !== "/admin/dashboard" && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                  )}
                  data-ocid={`admin.nav.${label.toLowerCase()}_link`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              data-ocid="admin.sidebar_logout_button"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
