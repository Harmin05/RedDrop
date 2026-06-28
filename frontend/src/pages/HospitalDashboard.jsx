import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Bell, CheckCircle2, ClipboardList, Droplets, History, Save, UserCircle2, Users, } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const fmtDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const HospitalDashboard = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { toast } = useToast();
    const location = useLocation();
    const [isBusy, setIsBusy] = useState(false);
    const [overview, setOverview] = useState({
        totalDonors: 0,
        totalBloodUnits: 0,
        totalRequests: 0,
        pendingRequests: 0,
        completedDonations: 0,
    });
    const [inventory, setInventory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [donors, setDonors] = useState([]);
    const [donations, setDonations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activities, setActivities] = useState([]);
    const [reports, setReports] = useState({
        totalDonations: 0,
        totalUnitsDonated: 0,
        mostRequestedBloodGroup: "N/A",
        monthlyDonationData: [],
    });
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
    });
    const [inventoryForm, setInventoryForm] = useState({
        bloodGroup: "A+",
        units: "",
        minLevel: "5",
    });
    const [donationForm, setDonationForm] = useState({
        donorName: "",
        bloodGroup: "A+",
        unitsDonated: "",
        donationDate: new Date().toISOString().slice(0, 10),
    });
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
    };
    const loadDashboardData = useCallback(async () => {
        if (!token)
            return;
        try {
            const [overviewRes, inventoryRes, requestsRes, donorsRes, donationsRes, notificationsRes, activitiesRes, profileRes, reportsRes,] = await Promise.all([
                fetch(apiUrl("/api/dashboard/overview"), { headers }),
                fetch(apiUrl("/api/dashboard/inventory"), { headers }),
                fetch(apiUrl("/api/requests"), { headers }),
                fetch(apiUrl("/api/donors"), { headers }),
                fetch(apiUrl("/api/dashboard/donations"), { headers }),
                fetch(apiUrl("/api/dashboard/notifications"), { headers }),
                fetch(apiUrl("/api/dashboard/activities"), { headers }),
                fetch(apiUrl("/api/dashboard/profile"), { headers }),
                fetch(apiUrl("/api/dashboard/reports"), { headers }),
            ]);
            const overviewData = await overviewRes.json();
            const inventoryData = await inventoryRes.json();
            const requestsData = await requestsRes.json();
            const donorsData = await donorsRes.json();
            const donationsData = await donationsRes.json();
            const notificationsData = await notificationsRes.json();
            const activitiesData = await activitiesRes.json();
            const profileData = await profileRes.json();
            const reportsData = await reportsRes.json();
            setOverview(overviewData?.overview || overview);
            setInventory(Array.isArray(inventoryData?.inventory) ? inventoryData.inventory : []);
            setRequests(Array.isArray(requestsData?.requests) ? requestsData.requests : []);
            setDonors(Array.isArray(donorsData?.donors) ? donorsData.donors : []);
            setDonations(Array.isArray(donationsData?.records) ? donationsData.records : []);
            setNotifications(Array.isArray(notificationsData?.notifications) ? notificationsData.notifications : []);
            setActivities(Array.isArray(activitiesData?.activities) ? activitiesData.activities : []);
            if (profileData?.hospital) {
                setProfile({
                    name: profileData.hospital.name || "",
                    email: profileData.hospital.email || "",
                    phone: profileData.hospital.phone || "",
                    location: profileData.hospital.location || "",
                });
            }
            if (reportsData?.reports)
                setReports(reportsData.reports);
        }
        catch {
            toast({
                variant: "destructive",
                title: "Dashboard load failed",
                description: "Could not fetch hospital dashboard data.",
            });
        }
    }, [token, toast]);
    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);
    useEffect(() => {
        if (location.hash !== "#dashboard-notifications")
            return;
        const timer = window.setTimeout(() => {
            const section = document.getElementById("dashboard-notifications");
            section?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
        return () => window.clearTimeout(timer);
    }, [location.hash]);
    const emergencyRequests = useMemo(() => requests.filter((r) => r.isUrgent && r.status === "open"), [requests]);
    const lowStock = useMemo(() => inventory.filter((i) => i.units <= i.minLevel), [inventory]);
    const notificationItems = useMemo(() => notifications.map((text, index) => {
        const lower = text.toLowerCase();
        const priority = lower.includes("urgent") || lower.includes("low stock") ? "High" : "Normal";
        const title = lower.includes("urgent")
            ? "Urgent Blood Request Alert"
            : lower.includes("low stock")
                ? "Low Stock Warning"
                : lower.includes("donor")
                    ? "New Donor Activity"
                    : "System Notification";
        return {
            id: `notification-${index}`,
            title,
            summary: text,
            priority,
            details: `${text}\n\nPlease review the related section in dashboard and take action if needed.\n` +
                `Suggested next step: verify current status and update records.`,
            timestamp: new Date().toLocaleString("en-IN"),
        };
    }), [notifications]);
    const setRequestStatus = async (requestId, status) => {
        setIsBusy(true);
        try {
            const res = await fetch(apiUrl(`/api/requests/${requestId}/status`), {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Request update failed");
            await loadDashboardData();
            toast({ title: "Request updated", description: `Request marked as ${status}.` });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Status update failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsBusy(false);
        }
    };
    const addInventory = async () => {
        setIsBusy(true);
        try {
            const res = await fetch(apiUrl("/api/dashboard/inventory"), {
                method: "POST",
                headers,
                body: JSON.stringify({
                    bloodGroup: inventoryForm.bloodGroup,
                    units: Number(inventoryForm.units || 0),
                    minLevel: Number(inventoryForm.minLevel || 5),
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Inventory update failed");
            setInventoryForm((prev) => ({ ...prev, units: "" }));
            await loadDashboardData();
            toast({ title: "Inventory updated", description: "Blood stock saved." });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Inventory action failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsBusy(false);
        }
    };
    const removeInventory = async (inventoryId) => {
        setIsBusy(true);
        try {
            const res = await fetch(apiUrl(`/api/dashboard/inventory/${inventoryId}`), {
                method: "DELETE",
                headers,
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Inventory delete failed");
            await loadDashboardData();
            toast({ title: "Inventory removed", description: "Stock item deleted." });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsBusy(false);
        }
    };
    const saveDonation = async () => {
        setIsBusy(true);
        try {
            const res = await fetch(apiUrl("/api/dashboard/donations"), {
                method: "POST",
                headers,
                body: JSON.stringify({
                    donorName: donationForm.donorName,
                    bloodGroup: donationForm.bloodGroup,
                    unitsDonated: Number(donationForm.unitsDonated || 0),
                    donationDate: donationForm.donationDate,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Donation save failed");
            setDonationForm({
                donorName: "",
                bloodGroup: "A+",
                unitsDonated: "",
                donationDate: new Date().toISOString().slice(0, 10),
            });
            await loadDashboardData();
            toast({ title: "Donation recorded", description: "Donation history updated." });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Donation save failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsBusy(false);
        }
    };
    const saveProfile = async () => {
        setIsBusy(true);
        try {
            const res = await fetch(apiUrl("/api/dashboard/profile"), {
                method: "PATCH",
                headers,
                body: JSON.stringify(profile),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Profile update failed");
            await loadDashboardData();
            toast({ title: "Profile updated", description: "Hospital details saved." });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Profile update failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsBusy(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Loading..." }));
    }
    if (!isAuthenticated || user?.role !== "hospital") {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, {}), _jsxs("main", { className: "container py-8 space-y-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold", children: ["Hey ", user?.name || "Hospital", ", welcome to your dashboard"] }), _jsx("p", { className: "text-muted-foreground", children: "Manage requests, inventory, donors, profile, and reports from one place." })] }), _jsx(Button, { variant: "outline", asChild: true, children: _jsxs(Link, { to: "/", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Home"] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4", children: [_jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Total Donors" }), _jsx(CardTitle, { children: overview.totalDonors })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Blood Units Available" }), _jsx(CardTitle, { children: overview.totalBloodUnits })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Total Blood Requests" }), _jsx(CardTitle, { children: overview.totalRequests })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Pending Requests" }), _jsx(CardTitle, { children: overview.pendingRequests })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Completed Donations" }), _jsx(CardTitle, { children: overview.completedDonations })] }) })] }), lowStock.length > 0 && (_jsxs(Card, { className: "border-amber-500/40 max-h-[220px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-amber-600 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5" }), "Low Blood Stock Alerts"] }) }), _jsx(CardContent, { className: "text-sm overflow-y-auto pr-1", children: lowStock.map((item) => (_jsxs("p", { children: [item.bloodGroup, ": ", item.units, " units (minimum ", item.minLevel, ")"] }, item._id))) })] })), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "h-[420px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Droplets, { className: "h-5 w-5 text-primary" }), " Blood Inventory Management"] }) }), _jsxs(CardContent, { className: "space-y-4 overflow-y-auto pr-1", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsxs(Select, { value: inventoryForm.bloodGroup, onValueChange: (value) => setInventoryForm((p) => ({ ...p, bloodGroup: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Blood Group" }) }), _jsx(SelectContent, { children: bloodGroups.map((g) => _jsx(SelectItem, { value: g, children: g }, g)) })] }), _jsx(Input, { placeholder: "Units to add", type: "number", min: 0, value: inventoryForm.units, onChange: (e) => setInventoryForm((p) => ({ ...p, units: e.target.value })) }), _jsx(Input, { placeholder: "Min level", type: "number", min: 0, value: inventoryForm.minLevel, onChange: (e) => setInventoryForm((p) => ({ ...p, minLevel: e.target.value })) }), _jsx(Button, { onClick: addInventory, disabled: isBusy, children: "Add / Update" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Group" }), _jsx("th", { children: "Units" }), _jsx("th", { children: "Min Level" }), _jsx("th", { className: "text-right", children: "Action" })] }) }), _jsx("tbody", { children: inventory.map((item) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "py-2 font-medium", children: item.bloodGroup }), _jsx("td", { children: item.units }), _jsx("td", { children: item.minLevel }), _jsx("td", { className: "text-right", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => removeInventory(item._id), disabled: isBusy, children: "Remove" }) })] }, item._id))) })] }) })] })] }), _jsxs(Card, { className: "h-[420px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }), " Emergency Blood Requests"] }) }), _jsx(CardContent, { className: "space-y-3 text-sm overflow-y-auto pr-1", children: emergencyRequests.map((r) => (_jsxs("div", { className: "rounded-lg border border-red-400/40 p-3", children: [_jsxs("p", { className: "font-medium", children: [r.bloodGroup, " - ", r.units, " units"] }), _jsx("p", { className: "text-muted-foreground", children: r.patientNote || "Emergency case" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Requested: ", fmtDate(r.createdAt)] })] }, r._id))) })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "h-[420px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(ClipboardList, { className: "h-5 w-5 text-primary" }), " Blood Request Management"] }) }), _jsx(CardContent, { className: "overflow-y-auto pr-1", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground sticky top-0 bg-background z-10", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Patient / Note" }), _jsx("th", { children: "Group" }), _jsx("th", { children: "Units" }), _jsx("th", { children: "Date" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Action" })] }) }), _jsxs("tbody", { children: [requests.map((r) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "py-1.5", children: r.patientNote || "Emergency" }), _jsx("td", { children: r.bloodGroup }), _jsx("td", { children: r.units }), _jsx("td", { children: fmtDate(r.createdAt) }), _jsx("td", { className: "capitalize", children: r.status }), _jsx("td", { children: _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => setRequestStatus(r._id, "open"), disabled: isBusy || r.status === "open", children: "Approve" }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setRequestStatus(r._id, "cancelled"), disabled: isBusy || r.status === "cancelled", children: "Reject" }), _jsx(Button, { size: "sm", variant: "default", onClick: () => setRequestStatus(r._id, "fulfilled"), disabled: isBusy || r.status === "fulfilled", children: "Complete" })] }) })] }, r._id))), requests.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "py-4 text-center text-muted-foreground", children: "No real blood requests found for this hospital yet." }) }))] })] }) }) })] }), _jsxs(Card, { className: "h-[420px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Users, { className: "h-5 w-5 text-primary" }), " Donor Management"] }) }), _jsx(CardContent, { className: "overflow-y-auto pr-1", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground sticky top-0 bg-background z-10", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Name" }), _jsx("th", { children: "Group" }), _jsx("th", { children: "Location" }), _jsx("th", { children: "Available" }), _jsx("th", { children: "Last Donation" }), _jsx("th", { className: "text-right", children: "Action" })] }) }), _jsxs("tbody", { children: [donors.map((d) => (_jsxs("tr", { className: "group border-t transition-colors hover:bg-rose-50/70", children: [_jsx("td", { className: "py-3 font-medium transition-colors group-hover:text-rose-700", children: d.name }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: d.bloodGroup }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: d.location }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: d.isAvailable ? "Yes" : "No" }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: fmtDate(d.lastDonationDate) }), _jsx("td", { className: "py-3 text-right", children: _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { size: "sm", variant: "outline", className: "transition-colors group-hover:border-rose-300 group-hover:bg-white", children: "Contact" }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: d.name }), _jsx(DialogDescription, { children: "Donor contact and availability details." })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Blood Group" }), _jsx("p", { className: "text-muted-foreground", children: d.bloodGroup })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Phone" }), _jsx("p", { className: "text-muted-foreground", children: d.phone || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Email" }), _jsx("p", { className: "text-muted-foreground", children: d.email || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Location" }), _jsx("p", { className: "text-muted-foreground", children: d.location || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Availability" }), _jsx("p", { className: "text-muted-foreground", children: d.isAvailable ? "Available" : "Unavailable" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Last Donation" }), _jsx("p", { className: "text-muted-foreground", children: fmtDate(d.lastDonationDate) })] })] })] })] }) })] }, d._id))), donors.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: "py-4 text-center text-muted-foreground", children: "No donors available right now." }) }))] })] }) }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(History, { className: "h-5 w-5 text-primary" }), " Donation Records"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsx(Input, { placeholder: "Donor name", value: donationForm.donorName, onChange: (e) => setDonationForm((p) => ({ ...p, donorName: e.target.value })) }), _jsxs(Select, { value: donationForm.bloodGroup, onValueChange: (value) => setDonationForm((p) => ({ ...p, bloodGroup: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Group" }) }), _jsx(SelectContent, { children: bloodGroups.map((g) => _jsx(SelectItem, { value: g, children: g }, g)) })] }), _jsx(Input, { placeholder: "Units", type: "number", min: 1, value: donationForm.unitsDonated, onChange: (e) => setDonationForm((p) => ({ ...p, unitsDonated: e.target.value })) }), _jsx(Input, { type: "date", className: "w-full min-w-0 pr-8", value: donationForm.donationDate, onChange: (e) => setDonationForm((p) => ({ ...p, donationDate: e.target.value })) })] }), _jsx(Button, { onClick: saveDonation, disabled: isBusy, children: "Save Donation Record" }), _jsx("div", { className: "overflow-x-auto max-h-[220px] overflow-y-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground sticky top-0 bg-background z-10", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Donor" }), _jsx("th", { children: "Group" }), _jsx("th", { children: "Units" }), _jsx("th", { children: "Date" })] }) }), _jsx("tbody", { children: donations.map((d) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "py-2", children: d.donorName }), _jsx("td", { children: d.bloodGroup }), _jsx("td", { children: d.unitsDonated }), _jsx("td", { children: fmtDate(d.donationDate) })] }, d._id))) })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(UserCircle2, { className: "h-5 w-5 text-primary" }), " Hospital Profile Management"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Hospital Name" }), _jsx(Input, { value: profile.name, onChange: (e) => setProfile((p) => ({ ...p, name: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Email" }), _jsx(Input, { value: profile.email, onChange: (e) => setProfile((p) => ({ ...p, email: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: profile.phone, onChange: (e) => setProfile((p) => ({ ...p, phone: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Address" }), _jsx(Input, { value: profile.location, onChange: (e) => setProfile((p) => ({ ...p, location: e.target.value })) })] }), _jsx("div", { className: "pt-1", children: _jsxs(Button, { onClick: saveProfile, disabled: isBusy, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), "Save Profile"] }) })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-6", children: [_jsxs(Card, { id: "dashboard-notifications", className: "h-[360px] flex flex-col scroll-mt-24", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-5 w-5 text-primary" }), " Notifications Panel"] }) }), _jsxs(CardContent, { className: "space-y-2 text-sm overflow-y-auto pr-1", children: [notifications.length === 0 && _jsx("p", { className: "text-muted-foreground", children: "No new notifications." }), notificationItems.map((n) => (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx("button", { type: "button", className: "w-full text-left rounded-md border p-2 hover:border-primary/40 hover:bg-muted/30 transition-colors", children: n.summary }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: n.title }), _jsxs(DialogDescription, { children: ["Priority: ", _jsx("span", { className: "font-medium", children: n.priority }), " \u00B7 ", n.timestamp] })] }), _jsx("div", { className: "space-y-3 text-sm", children: n.details.split("\n").map((line, idx) => (_jsx("p", { children: line }, `${n.id}-line-${idx}`))) })] })] }, n.id)))] })] }), _jsxs(Card, { className: "h-[360px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(History, { className: "h-5 w-5 text-primary" }), " Recent Activity Log"] }) }), _jsxs(CardContent, { className: "space-y-2 text-sm overflow-y-auto pr-1", children: [activities.length === 0 && _jsx("p", { className: "text-muted-foreground", children: "No recent activity." }), activities.map((a) => (_jsxs("div", { className: "rounded-md border p-2", children: [_jsx("p", { children: a.message }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: new Date(a.createdAt).toLocaleString("en-IN") })] }, a._id)))] })] }), _jsxs(Card, { className: "h-[360px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }), " Reports & Analytics"] }) }), _jsxs(CardContent, { className: "space-y-3 text-sm overflow-y-auto pr-1", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Total Donations:" }), " ", reports.totalDonations] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Total Units Donated:" }), " ", reports.totalUnitsDonated] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Most Requested Group:" }), " ", reports.mostRequestedBloodGroup] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium mb-1", children: "Monthly Donation Data" }), reports.monthlyDonationData.length === 0 && _jsx("p", { className: "text-muted-foreground", children: "No monthly data yet." }), reports.monthlyDonationData.map((m) => (_jsxs("p", { children: [m.month, ": ", m.units, " units"] }, m.month)))] })] })] })] })] }), _jsx(Footer, {})] }));
};
export default HospitalDashboard;
