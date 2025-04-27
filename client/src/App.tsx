import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Lazy load components
const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const VerifyPage = lazy(() => import("@/pages/verify-page"));
const StudentDashboard = lazy(() => import("@/pages/dashboard/student-dashboard"));
const HelperDashboard = lazy(() => import("@/pages/dashboard/helper-dashboard"));
const CreateAssignment = lazy(() => import("@/pages/assignments/create-assignment"));
const BrowseAssignments = lazy(() => import("@/pages/assignments/browse-assignments"));
const AssignmentDetail = lazy(() => import("@/pages/assignments/assignment-detail"));
const BrowseHelpers = lazy(() => import("@/pages/helpers/browse-helpers"));
const HelperDetail = lazy(() => import("@/pages/helpers/helper-detail"));
const Messages = lazy(() => import("@/pages/profile/messages"));
const Reviews = lazy(() => import("@/pages/profile/reviews"));
const Settings = lazy(() => import("@/pages/profile/settings"));

function Router() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center">Loading...</div>}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/verify" component={VerifyPage} />
        
        <ProtectedRoute path="/dashboard/student" component={StudentDashboard} />
        <ProtectedRoute path="/dashboard/helper" component={HelperDashboard} />
        
        <ProtectedRoute path="/assignments/create" component={CreateAssignment} />
        <Route path="/assignments" component={BrowseAssignments} />
        <Route path="/assignments/:id" component={AssignmentDetail} />
        
        <Route path="/helpers" component={BrowseHelpers} />
        <Route path="/helpers/:id" component={HelperDetail} />
        
        <ProtectedRoute path="/messages" component={Messages} />
        <ProtectedRoute path="/messages/:id" component={Messages} />
        <ProtectedRoute path="/reviews" component={Reviews} />
        <ProtectedRoute path="/settings" component={Settings} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
