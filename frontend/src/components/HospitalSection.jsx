import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, MapPin, Building2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import HospitalCard from "./HospitalCard";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
const bloodGroups = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const getHospitalDedupKey = (hospital) => {
    const normalizedName = hospital.name.trim().toLowerCase();
    const normalizedLocation = hospital.location.trim().toLowerCase();
    const normalizedPhone = hospital.phone?.trim().toLowerCase();
    if (normalizedPhone) {
        return `name-location-phone:${normalizedName}::${normalizedLocation}::${normalizedPhone}`;
    }
    return `name-location:${normalizedName}::${normalizedLocation}`;
};
const HospitalSection = () => {
    const { user, isAuthenticated } = useAuth();
    const isDonorUser = isAuthenticated && user?.role === "user";
    const [selectedBloodGroup, setSelectedBloodGroup] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [range, setRange] = useState([15]);
    const [hospitals, setHospitals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const fetchHospitalData = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const authHeaders = token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : undefined;
            const [hospitalRes, requestResponses] = await Promise.all([
                fetch(apiUrl("/api/hospitals"), {
                    headers: authHeaders,
                }),
                isDonorUser
                    ? Promise.resolve([])
                    : Promise.all([
                        fetch(apiUrl("/api/requests?status=open"), {
                            headers: authHeaders,
                        }),
                    ]),
            ]);
            const [requestRes] = requestResponses;
            const hospitalsData = await hospitalRes.json();
            const requestsData = requestRes ? await requestRes.json() : { requests: [] };
            if (!hospitalRes.ok) {
                throw new Error(hospitalsData?.message || "Failed to load hospitals");
            }
            if (requestRes && !requestRes.ok) {
                throw new Error(requestsData?.message || "Failed to load blood requests");
            }
            const apiHospitals = Array.isArray(hospitalsData?.hospitals)
                ? hospitalsData.hospitals
                : [];
            const uniqueHospitals = Array.from(new Map(apiHospitals.map((hospital) => [getHospitalDedupKey(hospital), hospital])).values());
            const apiRequests = Array.isArray(requestsData?.requests)
                ? requestsData.requests
                : [];
            const requestsByHospital = new Map();
            for (const req of apiRequests) {
                const hospitalId = req.hospital?._id;
                if (!hospitalId)
                    continue;
                if (!requestsByHospital.has(hospitalId)) {
                    requestsByHospital.set(hospitalId, []);
                }
                requestsByHospital.get(hospitalId)?.push({
                    bloodGroup: req.bloodGroup,
                    units: req.units,
                    isUrgent: Boolean(req.isUrgent),
                });
            }
            const mapped = uniqueHospitals
                .map((hospital, index) => ({
                id: hospital._id,
                name: hospital.name,
                location: hospital.location,
                // Distance is not available in current API; keep a deterministic placeholder.
                distance: `${(2.5 + (index % 8) * 1.7).toFixed(1)} km`,
                distanceKm: 2.5 + (index % 8) * 1.7,
                phone: hospital.phone,
                email: hospital.email,
                requirements: requestsByHospital.get(hospital._id) || [],
            }));
            setHospitals(mapped);
        }
        catch (error) {
            setHospitals([]);
            setLoadError(error instanceof Error ? error.message : "Unable to load hospital data");
        }
        finally {
            setIsLoading(false);
        }
    }, [isDonorUser]);
    useEffect(() => {
        fetchHospitalData();
        const onDataUpdated = () => fetchHospitalData();
        window.addEventListener("reddrop:data-updated", onDataUpdated);
        return () => window.removeEventListener("reddrop:data-updated", onDataUpdated);
    }, [fetchHospitalData]);
    const visibleHospitals = useMemo(() => {
        if (!isAuthenticated || user?.role !== "hospital") {
            return hospitals;
        }
        const currentEmail = user.email.toLowerCase();
        return hospitals.filter((hospital) => hospital.id === user.id ||
            (hospital.email ? hospital.email.toLowerCase() === currentEmail : false));
    }, [hospitals, isAuthenticated, user]);
    const filteredHospitals = useMemo(() => visibleHospitals.filter((hospital) => {
        const matchesBloodGroup = selectedBloodGroup === "All" ||
            hospital.requirements.some((r) => r.bloodGroup === selectedBloodGroup);
        const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hospital.location.toLowerCase().includes(searchQuery.toLowerCase());
        const withinRange = hospital.distanceKm === null || hospital.distanceKm <= range[0];
        return matchesBloodGroup && matchesSearch && withinRange;
    }), [visibleHospitals, selectedBloodGroup, searchQuery, range]);
    // Sort by urgent first
    const sortedHospitals = useMemo(() => [...filteredHospitals].sort((a, b) => {
        const aUrgent = a.requirements.some((r) => r.isUrgent);
        const bUrgent = b.requirements.some((r) => r.isUrgent);
        if (aUrgent && !bUrgent)
            return -1;
        if (!aUrgent && bUrgent)
            return 1;
        return 0;
    }), [filteredHospitals]);
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedBloodGroup("All");
        setRange([15]);
    };
    return (_jsx("section", { id: "hospitals", className: "py-20", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("h2", { className: "text-3xl md:text-4xl font-bold mb-4", children: [_jsx("span", { className: "text-gradient", children: "Hospital" }), " Blood Requirements"] }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: "View blood requirements from hospitals near you. Urgent requests are highlighted for immediate attention." })] }), _jsxs("div", { className: "relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-5 md:p-6 card-shadow mb-8", children: [_jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" }), _jsxs("div", { className: "relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.18em] text-muted-foreground", children: "Smart Filters" }), _jsx("h3", { className: "text-base font-semibold", children: "Find the right hospital faster" })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsxs("span", { className: "rounded-full bg-background/80 border px-3 py-1.5 text-muted-foreground", children: ["Radius: ", range[0], " km"] }), !isDonorUser && (_jsxs("span", { className: "rounded-full bg-background/80 border px-3 py-1.5 text-muted-foreground", children: ["Group: ", selectedBloodGroup] }))] })] }), isDonorUser ? (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px_auto] gap-3 lg:items-center", children: [_jsxs("div", { className: "rounded-xl border bg-background/80 px-3 py-2", children: [_jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5", children: "Hospital Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by hospital name or location", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-10 pl-10 border-border/70" })] })] }), _jsxs("div", { className: "rounded-xl border bg-background/80 px-3 py-2", children: [_jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5", children: "Distance Range" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }), _jsx(Slider, { value: range, onValueChange: setRange, max: 25, min: 1, step: 1, className: "flex-1" }), _jsxs("span", { className: "text-sm font-semibold w-16 text-right", children: [range[0], " km"] })] })] }), _jsx(Button, { type: "button", variant: "outline", onClick: resetFilters, className: "h-[62px] rounded-xl px-5 text-sm font-semibold border-border/70 hover:border-primary/40", children: "Reset" })] })) : (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_0.8fr_1fr_auto] gap-3", children: [_jsxs("div", { className: "rounded-xl border bg-background/80 px-3 py-2", children: [_jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5", children: "Hospital Search" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by hospital name or location", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "h-10 pl-10 border-border/70" })] })] }), _jsxs("div", { className: "rounded-xl border bg-background/80 px-3 py-2", children: [_jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5", children: "Blood Group" }), _jsxs(Select, { value: selectedBloodGroup, onValueChange: setSelectedBloodGroup, children: [_jsx(SelectTrigger, { className: "h-10 border-border/70", children: _jsx(SelectValue, { placeholder: "Blood Group Needed" }) }), _jsx(SelectContent, { children: bloodGroups.map((group) => (_jsx(SelectItem, { value: group, children: group === "All" ? "All Blood Groups" : group }, group))) })] })] }), _jsxs("div", { className: "rounded-xl border bg-background/80 px-3 py-2", children: [_jsx("p", { className: "text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1.5", children: "Distance Range" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground flex-shrink-0" }), _jsx(Slider, { value: range, onValueChange: setRange, max: 25, min: 1, step: 1, className: "flex-1" }), _jsxs("span", { className: "text-sm font-semibold w-16 text-right", children: [range[0], " km"] })] })] }), _jsx(Button, { type: "button", variant: "outline", onClick: resetFilters, className: "h-[62px] rounded-xl px-5 text-sm font-semibold border-border/70 hover:border-primary/40", children: "Reset Filters" })] }))] }), _jsx("div", { className: "flex items-center justify-between mb-6", children: _jsx("p", { className: "text-sm text-muted-foreground", children: isLoading
                            ? "Loading hospitals..."
                            : (_jsxs(_Fragment, { children: ["Found ", _jsx("span", { className: "font-semibold text-foreground", children: sortedHospitals.length }), " ", isDonorUser ? "hospitals (non-emergency)" : "hospitals with blood requirements"] })) }) }), !isLoading && loadError && (_jsx("div", { className: "text-center py-8 text-destructive", children: loadError })), !isLoading && !loadError && !isDonorUser && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start", children: sortedHospitals.map((hospital) => (_jsx(HospitalCard, { ...hospital }, hospital.id))) })), !isLoading && !loadError && isDonorUser && (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start", children: sortedHospitals.map((hospital) => (_jsx(HospitalCard, { ...hospital }, hospital.id))) })), !isLoading && !loadError && sortedHospitals.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Building2, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }), _jsx("p", { className: "text-muted-foreground", children: "No hospitals found matching your criteria." })] }))] }) }));
};
export default HospitalSection;
