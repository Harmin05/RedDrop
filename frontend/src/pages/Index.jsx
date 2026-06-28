import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import EmergencySection from "@/components/EmergencySection";
import HospitalSection from "@/components/HospitalSection";
import DonorSection from "@/components/DonorSection";
import RegistrationSection from "@/components/RegistrationSection";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { useAuth } from "@/hooks/useAuth";
const Index = () => {
    const { user, isAuthenticated } = useAuth();
    const isHospital = isAuthenticated && user?.role === "hospital";
    const isUser = isAuthenticated && user?.role === "user";
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, {}), _jsxs("main", { children: [_jsx(HeroSection, {}), isHospital && _jsx(DonorSection, {}), _jsx(EmergencySection, {}), isUser && _jsx(HospitalSection, {}), _jsx(RegistrationSection, {})] }), _jsx(Footer, {}), _jsx(ChatBot, {})] }));
};
export default Index;
