import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useRouter,
} from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminSettings } from "./pages/AdminSettings";
import { AdminSubmissions } from "./pages/AdminSubmissions";
import { AlumniFeedbackForm } from "./pages/AlumniFeedbackForm";
import { SubmissionDetail } from "./pages/SubmissionDetail";

function RouteErrorComponent({ error }: { error: unknown }) {
  const router = useRouter();
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => router.invalidate()}
            data-ocid="error.reload_button"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => router.navigate({ to: "/" })}
            data-ocid="error.home_button"
          >
            <Home className="w-3.5 h-3.5" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl font-bold text-muted-foreground">404</span>
        </div>
        <div className="space-y-1.5">
          <h1 className="font-display text-xl font-bold text-foreground">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => router.navigate({ to: "/" })}
          data-ocid="notfound.home_button"
        >
          <Home className="w-3.5 h-3.5" />
          Go home
        </Button>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  ),
  errorComponent: RouteErrorComponent,
  notFoundComponent: NotFoundComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: AlumniFeedbackForm,
  errorComponent: RouteErrorComponent,
});

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLogin,
  errorComponent: RouteErrorComponent,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: AdminDashboard,
  errorComponent: RouteErrorComponent,
});

const adminSubmissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/submissions",
  component: AdminSubmissions,
  errorComponent: RouteErrorComponent,
});

const submissionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/submissions/$id",
  component: SubmissionDetail,
  errorComponent: RouteErrorComponent,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/settings",
  component: AdminSettings,
  errorComponent: RouteErrorComponent,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  adminLoginRoute,
  adminDashboardRoute,
  adminSubmissionsRoute,
  submissionDetailRoute,
  adminSettingsRoute,
]);

const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteErrorComponent,
  defaultNotFoundComponent: NotFoundComponent,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
