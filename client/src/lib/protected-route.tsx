import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // For paths that should only be accessed by a specific user type
  if (path.includes('/dashboard/student') && user.userType !== 'student') {
    return (
      <Route path={path}>
        <Redirect to="/dashboard/helper" />
      </Route>
    );
  }
  
  if (path.includes('/dashboard/helper') && user.userType !== 'helper') {
    return (
      <Route path={path}>
        <Redirect to="/dashboard/student" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
