import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import DonorCard from "./DonorCard";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const toApproxDistance = (id) => {
    const hash = id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const km = ((hash % 240) + 10) / 10; // 1.0 to 24.9 km
    return `${km.toFixed(1)} km`;
};
const toRelativeLastDonation = (dateString) => {
    if (!dateString)
        return "Not provided";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime()))
        return "Not provided";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30)
        return `${Math.max(1, diffDays)} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} months ago`;
};
const DonorSection = () => {
    const { user, isAuthenticated } = useAuth();
    const [selectedBloodGroup, setSelectedBloodGroup] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [range, setRange] = useState([25]);
    const [donors, setDonors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const fetchDonors = async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            if (!token) {
                throw new Error("Please login to view donor details");
            }
            const res = await fetch(apiUrl("/api/donors"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error("Failed to load donors");
            }
            const data = await res.json();
            const apiDonors = Array.isArray(data?.donors) ? data.donors : [];
            const mapped = apiDonors.map((donor, index) => {
                const id = String(donor._id ?? donor.id ?? index + 1);
                return {
                    id,
                    userId: typeof donor.user === "string"
                        ? donor.user
                        : donor.user?._id || donor.user?.id || null,
                    name: donor.name,
                    bloodGroup: donor.bloodGroup,
                    location: donor.location,
                    distance: toApproxDistance(id),
                    lastDonation: toRelativeLastDonation(donor.lastDonationDate),
                    isAvailable: Boolean(donor.isAvailable),
                    phone: donor.phone,
                    email: donor.email,
                };
            });
            setDonors(mapped);
        }
        catch (error) {
            setDonors([]);
            setLoadError(error instanceof Error ? error.message : "Unable to fetch donors");
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchDonors();
        const handler = () => {
            fetchDonors();
        };
        window.addEventListener("reddrop:data-updated", handler);
        return () => window.removeEventListener("reddrop:data-updated", handler);
    }, []);
    const visibleDonors = useMemo(() => {
        if (!isAuthenticated || user?.role !== "user") {
            return donors;
        }
        const currentEmail = user.email.toLowerCase();
        return donors.filter((donor) => donor.userId === user.id ||
            (donor.email ? donor.email.toLowerCase() === currentEmail : false));
    }, [donors, isAuthenticated, user]);
    const filteredDonors = useMemo(() => visibleDonors.filter((donor) => {
        const matchesBloodGroup = selectedBloodGroup === "All" || donor.bloodGroup === selectedBloodGroup;
        const query = searchQuery.toLowerCase();
        const matchesSearch = donor.name.toLowerCase().includes(query) || donor.location.toLowerCase().includes(query);
        const withinRange = parseFloat(donor.distance) <= range[0];
        return matchesBloodGroup && matchesSearch && withinRange;
    }), [visibleDonors, selectedBloodGroup, searchQuery, range]);
    const clearFilters = () => {
        setSelectedBloodGroup("All");
        setSearchQuery("");
        setRange([25]);
    };
    return (_jsx("section", { id: "donors", className: "py-20 bg-muted/30", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: ["Find ", _jsx("span", { className: "text-gradient", children: "Blood Donors" }), " Near You"] }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: "Search for available blood donors in your area. Filter by blood group and distance to find the perfect match." })] }), _jsx("div", { className: "bg-card rounded-2xl p-6 card-shadow mb-8", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs("div", { className: "relative md:col-span-2", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by donor name or location...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" })] }), _jsxs(Select, { value: selectedBloodGroup, onValueChange: setSelectedBloodGroup, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Blood Group" }) }), _jsx(SelectContent, { children: bloodGroups.map((group) => (_jsx(SelectItem, { value: group, children: group === "All" ? "All Blood Groups" : group }, group))) })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }), _jsx(Slider, { value: range, onValueChange: setRange, max: 25, min: 1, step: 1, className: "flex-1" }), _jsxs("span", { className: "text-sm font-medium w-16 text-right", children: [range[0], " km"] })] }), _jsx(Button, { type: "button", variant: "outline", onClick: clearFilters, children: "Clear Filters" })] }) }), _jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: isLoading ? ("Loading donors...") : (_jsxs(_Fragment, { children: ["Found ", _jsx("span", { className: "font-semibold text-foreground", children: filteredDonors.length }), " donors"] })) }), _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-2", children: [_jsx(Filter, { className: "h-4 w-4" }), "More Filters"] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: filteredDonors.map((donor) => (_jsx(DonorCard, { ...donor }, donor.id))) }), !isLoading && loadError && (_jsx("div", { className: "text-center py-6", children: _jsx("p", { className: "text-destructive", children: loadError }) })), !isLoading && !loadError && filteredDonors.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No donors found matching your criteria." }) }))] }) }));
};
export default DonorSection;
