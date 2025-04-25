import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import VerifyPage from "@/pages/verify-page";
import { ProtectedRoute } from "@/lib/protected-route";
import StudentDashboard from "@/pages/dashboard/student-dashboard";
import HelperDashboard from "@/pages/dashboard/helper-dashboard";
import CreateAssignment from "@/pages/assignments/create-assignment";
import BrowseAssignments from "@/pages/assignments/browse-assignments";
import AssignmentDetail from "@/pages/assignments/assignment-detail";
import BrowseHelpers from "@/pages/helpers/browse-helpers";
import HelperDetail from "@/pages/helpers/helper-detail";
import Messages from "@/pages/profile/messages";
import Reviews from "@/pages/profile/reviews";
import Settings from "@/pages/profile/settings";

function Router() {
  return (
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
