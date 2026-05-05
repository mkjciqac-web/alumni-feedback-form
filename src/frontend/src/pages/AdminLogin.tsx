import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../hooks/use-admin-auth";
import { createBackendActorOnce } from "../hooks/use-backend";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin@318";

export function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/admin/submissions" });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate credentials client-side first
    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError("Invalid username or password");
      return;
    }

    setIsSubmitting(true);

    // Attempt to initialise the backend access control so that subsequent
    // admin operations (e.g. setBankDetails) are recognised. Errors are
    // silently ignored — the login still succeeds without this.
    try {
      const actor = await createBackendActorOnce();
      await actor._initializeAccessControl();
    } catch {
      // already initialised, or backend unavailable — continue anyway
    }

    // Persist auth state in localStorage and navigate
    login(username.trim(), password);
    navigate({ to: "/admin/submissions" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-xs h-14 flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-foreground text-sm">
            Alumni Feedback Form
          </span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Admin Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Login card */}
          <div
            className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5"
            data-ocid="admin.login_card"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                  data-ocid="admin.username_input"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    data-ocid="admin.password_input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    data-ocid="admin.toggle_password_button"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p
                  className="text-sm text-destructive font-medium"
                  data-ocid="admin.login_error_state"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                data-ocid="admin.login_button"
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Not an admin?{" "}
              <a href="/" className="text-primary hover:underline">
                Submit Alumni Feedback instead
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
