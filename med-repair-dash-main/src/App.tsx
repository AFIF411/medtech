import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import CreateTicket from "./pages/hospital/CreateTicket";
import CreateMaintenance from "./pages/hospital/CreateMaintenance";
import HospitalTicketDetail from "./pages/hospital/TicketDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTicketDetail from "./pages/admin/TicketDetail";
import TechnicianDashboard from "./pages/technician/TechnicianDashboard";
import InterventionDetail from "./pages/technician/InterventionDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

const RedirectToDashboard = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      navigate(`/${profile.role}/dashboard`);
    }
  }, [profile, loading, navigate]);

  if (loading) return null;
  
  return <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RedirectToDashboard />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            
            <Route 
              path="/hospital/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <HospitalDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/hospital/tickets/new" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <CreateTicket />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/hospital/maintenance/new" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <CreateMaintenance />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/hospital/tickets/:id" 
              element={
                <ProtectedRoute allowedRoles={['hospital']}>
                  <HospitalTicketDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/tickets/:id" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTicketDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/technician/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <TechnicianDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/technician/jobs/:id" 
              element={
                <ProtectedRoute allowedRoles={['technician']}>
                  <InterventionDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
