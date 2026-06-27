import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Heart, Building2, User, Phone, MapPin, Droplets } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RegistrationSection = () => {
    const { toast } = useToast();
    const { user, isAuthenticated } = useAuth();
    const sectionRef = useRef(null);
    const [donorForm, setDonorForm] = useState({
        name: "",
        phone: "",
        email: "",
        bloodGroup: "",
        location: "",
        lastDonationDate: "",
    });
    const [hospitalForm, setHospitalForm] = useState({
        name: "",
        phone: "",
        email: "",
        location: "",
        licenseNumber: "",
        bloodGroup: "",
        units: "",
        emergencyReason: "",
    });
    const [isDonorSubmitting, setIsDonorSubmitting] = useState(false);
    const [isHospitalSubmitting, setIsHospitalSubmitting] = useState(false);
    const location = useLocation();
    const handleDonorSubmit = async (e) => {
        e.preventDefault();
        setIsDonorSubmitting(true);
        try {
            const response = await fetch(apiUrl("/api/donors/public-register"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(donorForm),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to register donor");
            }
            toast({
                title: "Registration Successful!",
                description: "Donor details were saved to MongoDB.",
            });
            setDonorForm({
                name: "",
                phone: "",
                email: "",
                bloodGroup: "",
                location: "",
                lastDonationDate: "",
            });
            window.dispatchEvent(new Event("reddrop:data-updated"));
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Donor registration failed",
                description: error instanceof Error ? error.message : "Something went wrong. Try again.",
            });
        }
        finally {
            setIsDonorSubmitting(false);
        }
    };
    const handleHospitalSubmit = async (e) => {
        e.preventDefault();
        setIsHospitalSubmitting(true);
        try {
            const response = await fetch(apiUrl("/api/hospitals/public-register"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(hospitalForm),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to register hospital");
            }
            toast({
                title: "Emergency request submitted!",
                description: "Hospital details and urgent blood request were saved.",
            });
            setHospitalForm({
                name: "",
                phone: "",
                email: "",
                location: "",
                licenseNumber: "",
                bloodGroup: "",
                units: "",
                emergencyReason: "",
            });
            window.dispatchEvent(new Event("reddrop:data-updated"));
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Hospital registration failed",
                description: error instanceof Error ? error.message : "Something went wrong. Try again.",
            });
        }
        finally {
            setIsHospitalSubmitting(false);
        }
    };
    const [activeTab, setActiveTab] = useState("donor");
    const canShowDonorRegistration = !isAuthenticated || user?.role === "user";
    const canShowHospitalRegistration = !isAuthenticated || user?.role === "hospital";
    const visibleRegistrationTabsCount = Number(canShowDonorRegistration) + Number(canShowHospitalRegistration);
    const registrationHeading = isAuthenticated && user?.role === "user"
        ? "Donor Registration"
        : isAuthenticated && user?.role === "hospital"
            ? "Hospital Registration"
            : "Join the RedDrop Network";
    const registrationDescription = isAuthenticated && user?.role === "user"
        ? "Register as a donor to help save lives during emergencies."
        : isAuthenticated && user?.role === "hospital"
            ? "Register your hospital and submit blood requirements quickly."
            : "Register as a donor to help save lives or register your hospital to connect with available donors.";
    useEffect(() => {
        if (!isAuthenticated)
            return;
        if (user?.role === "user") {
            setActiveTab("donor");
            return;
        }
        if (user?.role === "hospital") {
            setActiveTab("hospital");
        }
    }, [isAuthenticated, user?.role]);
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab === "hospital" && canShowHospitalRegistration) {
            setActiveTab("hospital");
            return;
        }
        if (tab === "donor" && canShowDonorRegistration) {
            setActiveTab(tab);
        }
    }, [location.search, canShowDonorRegistration, canShowHospitalRegistration]);
    useEffect(() => {
        if (location.hash !== "#register")
            return;
        const scrollToRegister = () => {
            sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        };
        const timer = window.setTimeout(scrollToRegister, 0);
        return () => window.clearTimeout(timer);
    }, [location.hash, location.search]);
    return (_jsx("section", { id: "register", ref: sectionRef, className: "py-20 bg-muted/30 scroll-mt-24", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: isAuthenticated ? registrationHeading : _jsxs(_Fragment, { children: ["Join the ", _jsx("span", { className: "text-gradient", children: "RedDrop" }), " Network"] }) }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: registrationDescription })] }), _jsx("div", { className: "max-w-xl mx-auto", children: _jsxs(Tabs, { value: activeTab, onValueChange: (v) => setActiveTab(v), className: "w-full", children: [_jsxs(TabsList, { className: `grid w-full mb-8 ${visibleRegistrationTabsCount === 1 ? "grid-cols-1" : "grid-cols-2"}`, children: [canShowDonorRegistration && (_jsxs(TabsTrigger, { value: "donor", className: "gap-2", children: [_jsx(Heart, { className: "h-4 w-4" }), "Donor Registration"] })), canShowHospitalRegistration && (_jsxs(TabsTrigger, { value: "hospital", className: "gap-2", children: [_jsx(Building2, { className: "h-4 w-4" }), "Hospital Registration"] }))] }), canShowDonorRegistration && _jsx(TabsContent, { value: "donor", children: _jsxs("form", { onSubmit: handleDonorSubmit, className: "bg-card rounded-2xl p-6 card-shadow space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-name", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "donor-name", placeholder: "Enter your full name", value: donorForm.name, onChange: (e) => setDonorForm({ ...donorForm, name: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-phone", children: "Phone Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "donor-phone", type: "tel", placeholder: "+91 98765 43210", value: donorForm.phone, onChange: (e) => setDonorForm({ ...donorForm, phone: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-blood", children: "Blood Group" }), _jsxs(Select, { value: donorForm.bloodGroup, onValueChange: (value) => setDonorForm({ ...donorForm, bloodGroup: value }), required: true, children: [_jsxs(SelectTrigger, { id: "donor-blood", children: [_jsx(Droplets, { className: "h-4 w-4 text-muted-foreground mr-2" }), _jsx(SelectValue, { placeholder: "Select" })] }), _jsx(SelectContent, { children: bloodGroups.map((group) => (_jsx(SelectItem, { value: group, children: group }, group))) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-email", children: "Email Address" }), _jsx(Input, { id: "donor-email", type: "email", placeholder: "your@email.com", value: donorForm.email, onChange: (e) => setDonorForm({ ...donorForm, email: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-location", children: "Location" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "donor-location", placeholder: "Your area or city", value: donorForm.location, onChange: (e) => setDonorForm({ ...donorForm, location: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "donor-last-donation", children: "Last Donation Date" }), _jsx(Input, { id: "donor-last-donation", type: "date", value: donorForm.lastDonationDate, onChange: (e) => setDonorForm({ ...donorForm, lastDonationDate: e.target.value }), max: new Date().toISOString().split("T")[0] })] }), _jsxs(Button, { type: "submit", variant: "hero", className: "w-full", size: "lg", disabled: isDonorSubmitting, children: [_jsx(Heart, { className: "h-5 w-5" }), isDonorSubmitting ? "Registering..." : "Register as Donor"] })] }) }), canShowHospitalRegistration && _jsx(TabsContent, { value: "hospital", children: _jsxs("form", { onSubmit: handleHospitalSubmit, className: "bg-card rounded-2xl p-6 card-shadow space-y-5", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-name", children: "Hospital Name" }), _jsxs("div", { className: "relative", children: [_jsx(Building2, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "hospital-name", placeholder: "Enter hospital name", value: hospitalForm.name, onChange: (e) => setHospitalForm({ ...hospitalForm, name: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-phone", children: "Contact Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "hospital-phone", type: "tel", placeholder: "+91 98765 43210", value: hospitalForm.phone, onChange: (e) => setHospitalForm({ ...hospitalForm, phone: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-license", children: "License Number" }), _jsx(Input, { id: "hospital-license", placeholder: "Hospital license", value: hospitalForm.licenseNumber, onChange: (e) => setHospitalForm({ ...hospitalForm, licenseNumber: e.target.value }), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-email", children: "Email Address" }), _jsx(Input, { id: "hospital-email", type: "email", placeholder: "hospital@email.com", value: hospitalForm.email, onChange: (e) => setHospitalForm({ ...hospitalForm, email: e.target.value }), required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-blood", children: "Required Blood Group" }), _jsxs(Select, { value: hospitalForm.bloodGroup, onValueChange: (value) => setHospitalForm({ ...hospitalForm, bloodGroup: value }), required: true, children: [_jsxs(SelectTrigger, { id: "hospital-blood", children: [_jsx(Droplets, { className: "h-4 w-4 text-muted-foreground mr-2" }), _jsx(SelectValue, { placeholder: "Select" })] }), _jsx(SelectContent, { children: bloodGroups.map((group) => (_jsx(SelectItem, { value: group, children: group }, group))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-units", children: "Units Needed" }), _jsx(Input, { id: "hospital-units", type: "number", min: 1, placeholder: "e.g. 2", value: hospitalForm.units, onChange: (e) => setHospitalForm({ ...hospitalForm, units: e.target.value }), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-location", children: "Hospital Address" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "hospital-location", placeholder: "Full hospital address", value: hospitalForm.location, onChange: (e) => setHospitalForm({ ...hospitalForm, location: e.target.value }), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "hospital-reason", children: "Why blood is needed in emergency" }), _jsx(Input, { id: "hospital-reason", placeholder: "E.g., emergency surgery, trauma case, critical care", value: hospitalForm.emergencyReason, onChange: (e) => setHospitalForm({ ...hospitalForm, emergencyReason: e.target.value }), required: true })] }), _jsxs(Button, { type: "submit", variant: "hero", className: "w-full", size: "lg", disabled: isHospitalSubmitting, children: [_jsx(Building2, { className: "h-5 w-5" }), isHospitalSubmitting ? "Submitting..." : "Request Blood"] })] }) })] }) })] }) }));
};
export default RegistrationSection;
