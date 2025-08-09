import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import ApiKeys from "./pages/ApiKeys";
import DataSourceWebsite from "./pages/DataSourceWebsite";
import DataSourceFacebook from "./pages/DataSourceFacebook";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/settings" element={<Layout><Settings /></Layout>} />
          <Route path="/keys" element={<Layout><ApiKeys /></Layout>} />
          <Route path="/data-source/website" element={<Layout><DataSourceWebsite /></Layout>} />
          <Route path="/data-source/facebook" element={<Layout><DataSourceFacebook /></Layout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;