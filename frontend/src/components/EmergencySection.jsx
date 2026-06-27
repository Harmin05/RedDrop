import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Phone, Clock, Heart, Building2, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import BloodGroupBadge from "./BloodGroupBadge";
import { apiUrl } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "./ui/dialog";
const toRelativeTime = (dateString) => {
    if (!dateString)
        return "Recently posted";
    const timestamp = new Date(dateString).getTime();
    if (Number.isNaN(timestamp))
        return "Recently posted";
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1)
        return "Just now";
    if (diffMin < 60)
        return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24)
        return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};
const toReadableDateTime = (dateString) => {
    if (!dateString)
        return "Not specified";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()))
        return "Not specified";
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};
const EmergencySection = () => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const fetchEmergencyRequests = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const response = await fetch(apiUrl("/api/requests?urgentOnly=true&status=open"));
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Failed to load emergency requests");
            }
            const list = Array.isArray(data?.requests) ? data.requests : [];
            setRequests(list);
        }
        catch (error) {
            setRequests([]);
            setLoadError(error instanceof Error ? error.message : "Unable to load emergency requests");
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchEmergencyRequests();
        const onUpdated = () => {
            fetchEmergencyRequests();
        };
        window.addEventListener("reddrop:data-updated", onUpdated);
        return () => window.removeEventListener("reddrop:data-updated", onUpdated);
    }, [fetchEmergencyRequests]);
    const emergencyRequests = useMemo(() => {
        // Keep only the newest open emergency card per hospital for cleaner UX.
        const latestByHospital = new Map();
        for (const request of requests) {
            const hospitalKey = (request.hospitalName ||
                request.hospital?.name ||
                "Unknown Hospital").trim().toLowerCase();
            const current = latestByHospital.get(hospitalKey);
            if (!current) {
                latestByHospital.set(hospitalKey, request);
                continue;
            }
            const currentTs = new Date(current.createdAt || 0).getTime();
            const nextTs = new Date(request.createdAt || 0).getTime();
            if (nextTs > currentTs) {
                latestByHospital.set(hospitalKey, request);
            }
        }
        return Array.from(latestByHospital.values()).map((request, index) => ({
            id: String(request._id ?? request.id ?? index),
            hospital: request.hospitalName ||
                request.hospital?.name ||
                "Unknown Hospital",
            bloodGroup: request.bloodGroup,
            units: request.units,
            patient: request.patientNote || "Emergency",
            timePosted: toRelativeTime(request.createdAt),
            postedAt: toReadableDateTime(request.createdAt),
            neededBy: toReadableDateTime(request.neededBy),
            phone: request.hospital?.phone || "",
            location: request.hospital?.location || "Location not shared",
        }));
    }, [requests]);
    return (_jsx("section", { id: "emergency", className: "py-20 bg-urgent/5", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-urgent/10 text-urgent mb-4", children: [_jsx(AlertTriangle, { className: "h-4 w-4 animate-pulse-urgent" }), _jsx("span", { className: "text-sm font-semibold", children: "Emergency Requests" })] }), _jsxs("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: ["Urgent Blood ", _jsx("span", { className: "text-gradient", children: "Needed Now" })] }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: "These are critical emergencies requiring immediate blood donation. Your quick response can save a life." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12", children: [isLoading && (_jsx("div", { className: "col-span-full text-center text-muted-foreground", children: "Loading emergency requests..." })), !isLoading && loadError && (_jsx("div", { className: "col-span-full text-center text-destructive", children: loadError })), emergencyRequests.map((request) => (_jsxs("div", { className: "bg-card rounded-2xl p-6 card-shadow ring-2 ring-urgent/30 animate-pulse-urgent hover:animate-none transition-all", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsx(BloodGroupBadge, { bloodGroup: request.bloodGroup, size: "lg" }), _jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground", children: [_jsx(Clock, { className: "h-3 w-3" }), request.timePosted] })] }), _jsx("h3", { className: "font-semibold text-lg text-foreground mb-1", children: request.hospital }), _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: request.patient }), _jsx("div", { className: "flex items-center justify-between mb-4", children: _jsxs("span", { className: "text-sm font-medium text-urgent", children: [request.units, " units needed urgently"] }) }), _jsxs("div", { className: "pt-2 border-t flex items-center gap-3", children: [_jsx(Button, { variant: "urgent", className: "flex-1", asChild: true, disabled: !request.phone, children: _jsxs("a", { href: request.phone ? `tel:${request.phone}` : "#", "aria-disabled": !request.phone, children: [_jsx(Phone, { className: "h-4 w-4" }), "Respond Now"] }) }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", className: "flex-1", children: "View Details" }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Building2, { className: "h-4 w-4" }), request.hospital] }), _jsx(DialogDescription, { children: "Emergency request details and contact information." })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Blood Group:" }), " ", request.bloodGroup] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Units Needed:" }), " ", request.units] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Priority:" }), " Urgent"] }), _jsxs("p", { className: "flex items-center gap-2", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { children: [_jsx("span", { className: "font-medium", children: "Location:" }), " ", request.location] })] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Reason / Patient Note:" }), " ", request.patient] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Posted:" }), " ", request.postedAt, " (", request.timePosted, ")"] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Needed By:" }), " ", request.neededBy] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Hospital Phone:" }), " ", request.phone || "Not shared"] })] })] })] })] })] }, request.id))), !isLoading && !loadError && emergencyRequests.length === 0 && (_jsx("div", { className: "col-span-full text-center text-muted-foreground", children: "No active emergency requests right now." }))] }), _jsxs("div", { className: "text-center bg-card rounded-2xl p-8 card-shadow max-w-2xl mx-auto", children: [_jsx(Heart, { className: "h-12 w-12 text-primary mx-auto mb-4 animate-heartbeat", fill: "currentColor" }), _jsx("h3", { className: "text-xl font-semibold mb-2", children: "Every Second Counts" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Register as a donor today and be ready to save lives when emergencies happen." }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-3", children: [_jsx(Button, { variant: "hero", size: "lg", asChild: true, children: _jsx("a", { href: "/?tab=donor#register", children: "Register as Emergency Donor" }) }), _jsx(Button, { variant: "destructive", size: "lg", asChild: true, children: _jsx("a", { href: "/?tab=hospital#register", children: "Request Blood" }) })] })] })] }) }));
};
export default EmergencySection;
