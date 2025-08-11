import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import ApiKeys from "./pages/ApiKeys";
import DataSourceWebsite from "./pages/DataSourceWebsite";
import DataSourceFacebook from "./pages/DataSourceFacebook";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Account from "./pages/Account";
import Guide from "./pages/Guide";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/keys" element={<ApiKeys />} />
          <Route path="/data-source/website" element={<DataSourceWebsite />} />
          <Route path="/data-source/facebook" element={<DataSourceFacebook />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/account" element={<Account />} />
          <Route path="/guide" element={<Guide />} />
        </Route>
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner
            position="bottom-right"
            toastOptions={{
              classNames: {
                success: "bg-brand-orange-light text-brand-orange border-orange-200",
                error: "bg-red-100 text-red-600 border-red-200",
                loading: "bg-brand-orange-light text-brand-orange border-orange-200",
              },
            }}
          />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;