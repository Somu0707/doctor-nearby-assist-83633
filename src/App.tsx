import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import RoleSelection from "./pages/RoleSelection";
import Auth from "./pages/Auth";
import VillagerHome from "./pages/villager/VillagerHome";
import RequestHelp from "./pages/villager/RequestHelp";
import MyRequests from "./pages/villager/MyRequests";
import EmergencyVideos from "./pages/villager/EmergencyVideos";
import VillagerProfile from "./pages/villager/VillagerProfile";
import DoctorsList from "./pages/villager/DoctorsList";
import MedicalHistoryPage from "./pages/villager/MedicalHistoryPage";
import BookAppointment from "./pages/villager/BookAppointment";
import MyBookings from "./pages/villager/MyBookings";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import RespondRequest from "./pages/doctor/RespondRequest";
import UploadVideo from "./pages/doctor/UploadVideo";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import ManageBookings from "./pages/doctor/ManageBookings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/auth" element={<Auth />} />
              <Route path="/villager/home" element={<VillagerHome />} />
              <Route path="/villager/request" element={<RequestHelp />} />
              <Route path="/villager/my-requests" element={<MyRequests />} />
              <Route path="/villager/videos" element={<EmergencyVideos />} />
              <Route path="/villager/profile" element={<VillagerProfile />} />
              <Route path="/villager/doctors" element={<DoctorsList />} />
              <Route path="/villager/medical-history" element={<MedicalHistoryPage />} />
              <Route path="/villager/book-appointment" element={<BookAppointment />} />
              <Route path="/villager/bookings" element={<MyBookings />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/respond/:id" element={<RespondRequest />} />
            <Route path="/doctor/upload-video" element={<UploadVideo />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            <Route path="/doctor/bookings" element={<ManageBookings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
