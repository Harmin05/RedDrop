import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { extractBloodReportText, warmUpBloodReportOcr } from "@/lib/bloodReportOcr";
import { Activity, AlertTriangle, ArrowLeft, Bell, Building2, ChevronDown, ChevronRight, ClipboardList, Droplets, Eraser, Eye, FileText, HeartHandshake, History, Loader2, Save, ShieldAlert, Sparkles, Trash2, Upload } from "lucide-react";
const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const today = new Date().toISOString();
const dummyOverview = {
    bloodGroup: "O+",
    totalDonations: 4,
    lastDonationDate: "2026-01-18T00:00:00.000Z",
    isEligible: true,
    eligibilityLabel: "Eligible to donate now",
};
const dummyReminder = "You are currently eligible to donate. A nearby hospital may need your support this week.";
const dummyRecentActivities = [
    {
        id: "dummy-activity-1",
        type: "profile_updated",
        message: "Profile synced with donor registry.",
        createdAt: today,
    },
    {
        id: "dummy-activity-2",
        type: "donation_completed",
        message: "Donation recorded at City Care Hospital.",
        createdAt: "2026-01-18T00:00:00.000Z",
    },
];
const dummyRequests = [
    {
        _id: "dummy-request-1",
        patientName: "Aarav Sharma",
        hospitalName: "City Care Hospital",
        bloodGroup: "O+",
        units: 2,
        city: "Bengaluru",
        status: "pending",
        createdAt: today,
    },
    {
        _id: "dummy-request-2",
        patientName: "Meera Nair",
        hospitalName: "LifeLine Medical Center",
        bloodGroup: "A-",
        units: 1,
        city: "Mysuru",
        status: "approved",
        createdAt: "2026-02-12T00:00:00.000Z",
    },
];
const dummyDonationHistory = {
    "A+": [
        {
            _id: "dummy-donation-a-plus-1",
            hospitalName: "City Care Hospital",
            bloodGroup: "A+",
            unitsDonated: 1,
            donationDate: "2026-01-18T00:00:00.000Z",
        },
    ],
    "A-": [
        {
            _id: "dummy-donation-a-minus-1",
            hospitalName: "Sunrise Hospital",
            bloodGroup: "A-",
            unitsDonated: 1,
            donationDate: "2025-12-11T00:00:00.000Z",
        },
    ],
    "B+": [
        {
            _id: "dummy-donation-b-plus-1",
            hospitalName: "Civic Blood Center",
            bloodGroup: "B+",
            unitsDonated: 1,
            donationDate: "2025-11-20T00:00:00.000Z",
        },
    ],
    "B-": [
        {
            _id: "dummy-donation-b-minus-1",
            hospitalName: "Unity Hospital",
            bloodGroup: "B-",
            unitsDonated: 1,
            donationDate: "2025-10-05T00:00:00.000Z",
        },
    ],
    "AB+": [
        {
            _id: "dummy-donation-ab-plus-1",
            hospitalName: "LifeLine Medical Center",
            bloodGroup: "AB+",
            unitsDonated: 1,
            donationDate: "2025-12-28T00:00:00.000Z",
        },
    ],
    "AB-": [
        {
            _id: "dummy-donation-ab-minus-1",
            hospitalName: "Regional Care Hospital",
            bloodGroup: "AB-",
            unitsDonated: 1,
            donationDate: "2025-08-17T00:00:00.000Z",
        },
    ],
    "O+": [
        {
            _id: "dummy-donation-o-plus-1",
            hospitalName: "City Care Hospital",
            bloodGroup: "O+",
            unitsDonated: 1,
            donationDate: "2026-01-18T00:00:00.000Z",
        },
        {
            _id: "dummy-donation-o-plus-2",
            hospitalName: "Green Cross Hospital",
            bloodGroup: "O+",
            unitsDonated: 1,
            donationDate: "2025-09-21T00:00:00.000Z",
        },
    ],
    "O-": [
        {
            _id: "dummy-donation-o-minus-1",
            hospitalName: "Trauma Support Hospital",
            bloodGroup: "O-",
            unitsDonated: 1,
            donationDate: "2025-07-09T00:00:00.000Z",
        },
    ],
};
const donationGuidelines = [
    "Donor should not have diabetes or serious medical conditions.",
    "Donor should be 18 to 65 years old.",
    "Minimum weight should be 50 kg.",
    "Donor should not have donated blood in the last 90 days.",
    "Donor should not have fever, infection, or any major illness.",
    "Donor must be healthy and well-rested before donation.",
];
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const withTimeout = async (promise, timeoutMs, message) => {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
            }),
        ]);
    }
    finally {
        if (timer) {
            window.clearTimeout(timer);
        }
    }
};
const buildManualReportText = (values) => {
    const lines = [
        values.hemoglobin ? `Hemoglobin: ${values.hemoglobin} g/dL` : "",
        values.wbc ? `WBC: ${values.wbc} /cumm` : "",
        values.rbc ? `RBC: ${values.rbc} million/uL` : "",
        values.platelets ? `Platelets: ${values.platelets} /cumm` : "",
        values.cholesterol ? `Cholesterol: ${values.cholesterol} mg/dL` : "",
        values.glucose ? `Glucose: ${values.glucose} mg/dL` : "",
        values.hematocrit ? `Hematocrit: ${values.hematocrit} %` : "",
    ].filter(Boolean);
    return lines.join("\n");
};
const emptyManualParameters = () => ({
    hemoglobin: "",
    wbc: "",
    rbc: "",
    platelets: "",
    cholesterol: "",
    glucose: "",
    hematocrit: "",
});
const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
});
const getParameterBadgeVariant = (status) => {
    if (status === "normal")
        return "default";
    if (status === "borderline" || status === "unknown")
        return "secondary";
    return "destructive";
};
const getDonationBadgeVariant = (status) => {
    if (status === "eligible")
        return "default";
    if (status === "needs_review")
        return "secondary";
    return "destructive";
};
const getParameterTone = (status) => {
    if (status === "normal") {
        return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
    }
    if (status === "borderline" || status === "unknown") {
        return "border-amber-200 bg-amber-50/80 text-amber-900";
    }
    return "border-rose-200 bg-rose-50/80 text-rose-900";
};
const UserDashboard = () => {
    const { user, isAuthenticated, isLoading } = useAuth();
    const { toast } = useToast();
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const location = useLocation();
    const [isBusy, setIsBusy] = useState(false);
    const [overview, setOverview] = useState({
        bloodGroup: "Not set",
        totalDonations: 0,
        lastDonationDate: null,
        isEligible: false,
        eligibilityLabel: "Loading",
    });
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        age: "",
        bloodGroup: "A+",
        city: "",
        phone: "",
        isAvailable: true,
        lastDonationDate: "",
    });
    const [savedAvailability, setSavedAvailability] = useState(true);
    const [donationReminder, setDonationReminder] = useState("Stay ready to support when needed.");
    const [myRequests, setMyRequests] = useState([]);
    const [donationHistory, setDonationHistory] = useState([]);
    const [nearbyHospitals, setNearbyHospitals] = useState([]);
    const [availableBloodInfo, setAvailableBloodInfo] = useState([]);
    const [emergencyRequests, setEmergencyRequests] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [analysisFile, setAnalysisFile] = useState(null);
    const [analysisText, setAnalysisText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isAnalysisGuidanceOpen, setIsAnalysisGuidanceOpen] = useState(false);
    const [analysisDetail, setAnalysisDetail] = useState(null);
    const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
    const [isExtractingText, setIsExtractingText] = useState(false);
    const analysisFileInputRef = useRef(null);
    const [manualParameters, setManualParameters] = useState(emptyManualParameters);
    const [requestForm, setRequestForm] = useState({
        patientName: "",
        bloodGroup: "A+",
        units: "",
        hospitalName: "",
        city: "",
        reason: "",
        patientCondition: "",
        notes: "",
    });
    const [donationForm, setDonationForm] = useState({
        hospitalName: "",
        bloodGroup: "A+",
        unitsDonated: "",
        donationDate: new Date().toISOString().slice(0, 10),
    });
    const activeBloodGroup = profile.bloodGroup || overview.bloodGroup || dummyOverview.bloodGroup;
    const hasRealOverview = overview.bloodGroup !== "Not set" ||
        overview.totalDonations > 0 ||
        Boolean(overview.lastDonationDate);
    const displayOverview = hasRealOverview ? overview : dummyOverview;
    const displayDonationReminder = donationReminder !== "Stay ready to support when needed." ? donationReminder : dummyReminder;
    const displayNearbyHospitals = nearbyHospitals;
    const displayAvailableBloodInfo = availableBloodInfo;
    const displayNotifications = notifications;
    const displayEmergencyRequests = emergencyRequests.filter((item) => item.bloodGroup === activeBloodGroup);
    const displayRecentActivities = recentActivities.length > 0 ? recentActivities : dummyRecentActivities;
    const displayMyRequests = myRequests.length > 0 ? myRequests : dummyRequests;
    const displayDonationHistory = donationHistory.length > 0
        ? donationHistory.filter((record) => record.bloodGroup === activeBloodGroup)
        : dummyDonationHistory[activeBloodGroup] || [];
    const availabilityText = savedAvailability ? "Available" : "Unavailable";
    const headers = useMemo(() => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
    }), [token]);
    const loadDashboard = useCallback(async () => {
        if (!token)
            return;
        try {
            const res = await fetch(apiUrl("/api/user-dashboard"), { headers });
            const data = await res.json();
            if (!res.ok) {
                throw new Error("Could not load user dashboard.");
            }
            if (data.overview) {
                setOverview({
                    bloodGroup: data.overview.bloodGroup || "Not set",
                    totalDonations: data.overview.totalDonations || 0,
                    lastDonationDate: data.overview.lastDonationDate || null,
                    isEligible: Boolean(data.overview.isEligible),
                    eligibilityLabel: data.overview.eligibilityLabel || "Not available",
                });
            }
            if (data.profile) {
                setProfile({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                    age: data.profile.age !== undefined && data.profile.age !== null ? String(data.profile.age) : "",
                    bloodGroup: data.profile.bloodGroup || "A+",
                    city: data.profile.city || "",
                    phone: data.profile.phone || "",
                    isAvailable: data.profile.isAvailable ?? true,
                    lastDonationDate: data.profile.lastDonationDate ? String(data.profile.lastDonationDate).slice(0, 10) : "",
                });
                setSavedAvailability(data.profile.isAvailable ?? true);
            }
            setDonationReminder(data.donationReminder?.message || "Stay ready to support when needed.");
            setMyRequests(Array.isArray(data.myRequests) ? data.myRequests : []);
            setDonationHistory(Array.isArray(data.donationHistory) ? data.donationHistory : []);
            setNearbyHospitals(Array.isArray(data.nearbyHospitals) ? data.nearbyHospitals : []);
            setAvailableBloodInfo(Array.isArray(data.availableBloodInfo) ? data.availableBloodInfo : []);
            setEmergencyRequests(Array.isArray(data.emergencyRequests) ? data.emergencyRequests : []);
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setRecentActivities(Array.isArray(data.recentActivities) ? data.recentActivities : []);
            setAnalysisResult(data.bloodReportAnalysis || null);
            setAnalysisHistory(Array.isArray(data.bloodReportHistory) ? data.bloodReportHistory : []);
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Dashboard load failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
    }, [headers, toast, token]);
    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);
    useEffect(() => {
        if (location.hash !== "#dashboard-notifications")
            return;
        const timer = window.setTimeout(() => {
            const section = document.getElementById("dashboard-notifications");
            section?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
        return () => window.clearTimeout(timer);
    }, [location.hash]);
    const saveProfile = async () => {
        setIsBusy(true);
        try {
            const payload = {
                ...profile,
                age: profile.age === "" ? "" : Number(profile.age),
                lastDonationDate: profile.lastDonationDate || null,
            };
            const res = await fetch(apiUrl("/api/user-dashboard/profile"), {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Profile update failed");
            setSavedAvailability(profile.isAvailable);
            await loadDashboard();
            toast({ title: "Profile updated", description: "Your donor details were saved." });
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
    const analyzeBloodReport = async () => {
        const manualReportText = buildManualReportText(manualParameters);
        if (!analysisFile && !analysisText.trim() && !manualReportText.trim()) {
            toast({
                variant: "destructive",
                title: "Upload required",
                description: "Upload a report, paste report text, or enter blood values manually.",
            });
            return;
        }
        setIsAnalyzingReport(true);
        try {
            let fileDataUrl = "";
            let fileName = analysisFile?.name || "pasted-report.txt";
            let mimeType = analysisFile?.type || "text/plain";
            let extractedReportText = analysisText.trim() || manualReportText.trim();
            const isImageFile = Boolean(analysisFile?.type.startsWith("image/"));
            const isPdfFile = analysisFile?.type === "application/pdf";
            const needsOcr = analysisFile &&
                !extractedReportText &&
                (isImageFile || isPdfFile);
            if (needsOcr && analysisFile) {
                setIsExtractingText(true);
                try {
                    const extractedText = await withTimeout(extractBloodReportText(analysisFile), isImageFile ? 120000 : 45000, isImageFile
                        ? "Image text extraction is taking longer than expected."
                        : "Text extraction took too long on this device. Trying server-side analysis next.");
                    if (!extractedText) {
                        throw new Error("No readable report text was found in the selected file.");
                    }
                    extractedReportText = extractedText.trim();
                    setAnalysisText(extractedText);
                }
                catch (error) {
                    if (isPdfFile) {
                        fileDataUrl = await readFileAsDataUrl(analysisFile);
                    }
                    else {
                        throw new Error(error instanceof Error && error.message
                            ? `${error.message} Please upload a clearer blood report image or paste the report text manually.`
                            : "Could not read text from this image. Please upload a clearer blood report image or paste the report text manually.");
                    }
                }
                finally {
                    setIsExtractingText(false);
                }
            }
            const shouldUsePdfFallback = Boolean(analysisFile && !extractedReportText && isPdfFile);
            if (!analysisFile && manualReportText.trim()) {
                fileName = "manual-blood-report.txt";
            }
            if (analysisFile && (shouldUsePdfFallback || !extractedReportText)) {
                fileDataUrl = await readFileAsDataUrl(analysisFile);
            }
            const res = await fetch(apiUrl("/api/user-dashboard/blood-report-analyzer"), {
                method: "POST",
                headers,
                body: JSON.stringify({
                    fileName,
                    mimeType,
                    fileDataUrl,
                    reportText: extractedReportText,
                }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Blood report analysis failed");
            setAnalysisResult(data.analysis || null);
            resetAnalyzerForm();
            toast({
                title: "Analysis ready",
                description: "The blood report has been interpreted and added to your dashboard.",
            });
            await loadDashboard();
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Analysis failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsAnalyzingReport(false);
        }
    };
    const extractTextFromFile = async () => {
        if (!analysisFile) {
            toast({
                variant: "destructive",
                title: "No file selected",
                description: "Choose an image or PDF first.",
            });
            return;
        }
        if (!analysisFile.type.startsWith("image/") && analysisFile.type !== "application/pdf") {
            toast({
                variant: "destructive",
                title: "Unsupported file",
                description: "Only images and PDFs can be used for text extraction.",
            });
            return;
        }
        setIsExtractingText(true);
        try {
            const extractedText = await withTimeout(extractBloodReportText(analysisFile), analysisFile.type.startsWith("image/") ? 120000 : 45000, analysisFile.type.startsWith("image/")
                ? "Image text extraction is taking longer than expected. Try a clearer blood report image."
                : "Text extraction took too long. Try a clearer file or paste the report text manually.");
            if (!extractedText) {
                throw new Error("No readable report text was found in the selected file.");
            }
            setAnalysisText(extractedText);
            toast({
                title: "Text extracted",
                description: "Review the extracted text, then run analysis.",
            });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Text extraction failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
        finally {
            setIsExtractingText(false);
        }
    };
    const resetAnalyzerForm = () => {
        setAnalysisFile(null);
        setAnalysisText("");
        setManualParameters(emptyManualParameters());
        setAnalysisResult(null);
        if (analysisFileInputRef.current) {
            analysisFileInputRef.current.value = "";
        }
    };
    const deleteSavedAnalysis = async (analysisId) => {
        if (!analysisId)
            return;
        try {
            const res = await fetch(apiUrl(`/api/user-dashboard/blood-report-analyzer/${analysisId}`), {
                method: "DELETE",
                headers,
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Could not delete saved report");
            setAnalysisHistory((current) => current.filter((item) => item.id !== analysisId));
            setAnalysisResult((current) => (current?.id === analysisId ? null : current));
            toast({
                title: "Report deleted",
                description: "The saved blood report analysis was removed.",
            });
            await loadDashboard();
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: error instanceof Error ? error.message : "Try again.",
            });
        }
    };
    const submitRequest = async () => {
        setIsBusy(true);
        try {
            const payload = {
                patientName: requestForm.patientName,
                bloodGroup: requestForm.bloodGroup,
                units: Number(requestForm.units || 0),
                hospitalName: requestForm.hospitalName,
                city: requestForm.city,
                reason: requestForm.reason,
                patientCondition: requestForm.patientCondition,
                notes: requestForm.notes,
            };
            const res = await fetch(apiUrl("/api/user-dashboard/requests"), {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Request submission failed");
            setRequestForm({
                patientName: "",
                bloodGroup: profile.bloodGroup || "A+",
                units: "",
                hospitalName: "",
                city: profile.city || "",
                reason: "",
                patientCondition: "",
                notes: "",
            });
            await loadDashboard();
            toast({ title: "Request submitted", description: "Your blood request has been created." });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Request submission failed",
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
            const payload = {
                hospitalName: donationForm.hospitalName,
                bloodGroup: donationForm.bloodGroup,
                unitsDonated: Number(donationForm.unitsDonated || 0),
                donationDate: donationForm.donationDate,
            };
            const res = await fetch(apiUrl("/api/user-dashboard/donations"), {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data?.message || "Donation record save failed");
            setDonationForm({
                hospitalName: "",
                bloodGroup: profile.bloodGroup || "A+",
                unitsDonated: "",
                donationDate: new Date().toISOString().slice(0, 10),
            });
            await loadDashboard();
            toast({ title: "Donation recorded", description: "Your donation history has been updated." });
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
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Loading..." }));
    }
    if (!isAuthenticated || user?.role !== "user") {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, {}), _jsxs("main", { className: "container py-8 space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-3 md:flex-row md:items-center md:justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold", children: ["Hey ", user?.name || "User", ", welcome to your dashboard"] }), _jsx("p", { className: "text-muted-foreground", children: "Track eligibility, requests, donations, nearby hospitals, and alerts." })] }), _jsx(Button, { variant: "outline", asChild: true, children: _jsxs(Link, { to: "/", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Home"] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4", children: [_jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Blood Group" }), _jsx(CardTitle, { children: displayOverview.bloodGroup })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Total Donations" }), _jsx(CardTitle, { children: displayOverview.totalDonations })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Last Donation" }), _jsx(CardTitle, { children: formatDate(displayOverview.lastDonationDate) })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardDescription, { children: "Availability Status" }), _jsx(CardTitle, { className: "text-foreground", children: availabilityText })] }) })] }), _jsxs(Card, { className: displayOverview.isEligible ? "border-emerald-500/40" : "border-amber-500/40", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(HeartHandshake, { className: "h-5 w-5 text-primary" }), "Donation Reminder"] }) }), _jsx(CardContent, { className: "text-sm text-muted-foreground", children: displayDonationReminder })] }), _jsxs("button", { type: "button", onClick: () => setIsAnalyzerOpen(true), className: "fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(225,29,72,0.35)] transition hover:scale-[1.02] hover:shadow-[0_24px_55px_rgba(225,29,72,0.42)]", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/20", children: _jsx(Sparkles, { className: "h-5 w-5" }) }), _jsx("span", { className: "hidden sm:block", children: "Report Analyzer" })] }), isAnalyzerOpen && (_jsx("div", { className: "fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-3 py-4 backdrop-blur-sm sm:px-6", children: _jsx("div", { className: "mx-auto max-w-7xl rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#eef2f7_0%,#f7f2f2_100%)] shadow-2xl", children: _jsxs("div", { className: "py-2", children: [_jsx("div", { className: "pb-5", children: _jsxs("div", { className: "mx-auto flex w-full max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", onClick: () => setIsAnalyzerOpen(false), className: "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Back to Dashboard"] }), _jsxs(CardTitle, { className: "flex items-center gap-2 text-slate-800", children: [_jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm", children: _jsx(Sparkles, { className: "h-5 w-5" }) }), "AI Blood Report Analyzer"] }), _jsx(CardDescription, { className: "max-w-3xl text-slate-600", children: "Upload a blood report, paste report text, or enter manual values. The analyzer extracts major biomarkers, compares them with reference ranges, and summarizes donation readiness." })] }), analysisResult?.donationEligibility?.label ? (_jsx(Badge, { variant: getDonationBadgeVariant(analysisResult.donationEligibility.status), className: "w-fit self-start lg:self-center", children: analysisResult.donationEligibility.label })) : null] }) }), _jsx("div", { className: "px-0 py-4 sm:py-6", children: _jsxs("div", { className: "mx-auto grid max-w-6xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-1", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "rounded-2xl bg-white p-3 shadow-sm", children: _jsx(Upload, { className: "h-5 w-5 text-rose-600" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-base font-semibold text-slate-900", children: "Upload Your Blood Report" }), _jsx("p", { className: "text-xs text-slate-500", children: "Supported formats: PDF, JPG, PNG" })] })] }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsx(Label, { htmlFor: "blood-report-file", children: "Blood report file" }), _jsx(Input, { ref: analysisFileInputRef, id: "blood-report-file", type: "file", accept: ".pdf,image/*", onChange: (e) => {
                                                                                const nextFile = e.target.files?.[0] || null;
                                                                                setAnalysisFile(nextFile);
                                                                                setAnalysisText("");
                                                                                setManualParameters(emptyManualParameters());
                                                                                if (nextFile && (nextFile.type.startsWith("image/") || nextFile.type === "application/pdf")) {
                                                                                    void warmUpBloodReportOcr().catch(() => undefined);
                                                                                }
                                                                            } }), _jsx("p", { className: "text-xs text-muted-foreground", children: analysisFile ? analysisFile.name : "No file selected yet. You can still paste text or enter values manually." })] })] }), _jsxs("div", { className: "p-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "h-4 w-4 text-slate-600" }), _jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Paste report text" })] }), _jsx(Textarea, { id: "blood-report-text", className: "mt-3 min-h-[150px] border-slate-200 bg-slate-50/70", placeholder: "OCR text will appear here automatically for images/PDFs. You can also paste report text manually to improve accuracy.", value: analysisText, onChange: (e) => setAnalysisText(e.target.value) })] }), _jsxs("div", { className: "p-1", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Or Enter Values Manually" }), _jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [_jsx(Input, { placeholder: "Hemoglobin", value: manualParameters.hemoglobin, onChange: (e) => setManualParameters((prev) => ({ ...prev, hemoglobin: e.target.value })) }), _jsx(Input, { placeholder: "WBC", value: manualParameters.wbc, onChange: (e) => setManualParameters((prev) => ({ ...prev, wbc: e.target.value })) }), _jsx(Input, { placeholder: "RBC", value: manualParameters.rbc, onChange: (e) => setManualParameters((prev) => ({ ...prev, rbc: e.target.value })) }), _jsx(Input, { placeholder: "Platelets", value: manualParameters.platelets, onChange: (e) => setManualParameters((prev) => ({ ...prev, platelets: e.target.value })) }), _jsx(Input, { placeholder: "Cholesterol", value: manualParameters.cholesterol, onChange: (e) => setManualParameters((prev) => ({ ...prev, cholesterol: e.target.value })) }), _jsx(Input, { placeholder: "Glucose", value: manualParameters.glucose, onChange: (e) => setManualParameters((prev) => ({ ...prev, glucose: e.target.value })) }), _jsx(Input, { placeholder: "Hematocrit", value: manualParameters.hematocrit, onChange: (e) => setManualParameters((prev) => ({ ...prev, hematocrit: e.target.value })) })] }), _jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Manual entry remains available as the fastest fallback when OCR is unclear." })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: extractTextFromFile, disabled: !analysisFile || isExtractingText || isAnalyzingReport, className: "w-full", children: isExtractingText ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Extracting text"] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Extract Text From File"] })) }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsx(Button, { onClick: analyzeBloodReport, disabled: isAnalyzingReport || isBusy, className: "w-full bg-blue-600 hover:bg-blue-700", children: isAnalyzingReport ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Analyzing report"] })) : (_jsxs(_Fragment, { children: [_jsx(FileText, { className: "mr-2 h-4 w-4" }), "Analyze Report"] })) }), _jsxs(Button, { type: "button", variant: "outline", onClick: resetAnalyzerForm, disabled: isAnalyzingReport, className: "w-full", children: [_jsx(Eraser, { className: "mr-2 h-4 w-4" }), "Reset"] })] })] }), _jsx("div", { className: "px-1 py-2 text-xs leading-5 text-slate-600", children: "The analyzer compares hemoglobin, WBC, RBC, platelets, cholesterol, glucose, and other detected values against common adult reference ranges." }), _jsxs(Collapsible, { open: isHistoryOpen, onOpenChange: setIsHistoryOpen, className: "p-1", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 text-left", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm font-semibold text-slate-900", children: [_jsx(History, { className: "h-4 w-4 text-rose-600" }), "Previous Results"] }), isHistoryOpen ? _jsx(ChevronDown, { className: "h-4 w-4 text-slate-500" }) : _jsx(ChevronRight, { className: "h-4 w-4 text-slate-500" })] }) }), _jsx(CollapsibleContent, { className: "mt-3 space-y-2", children: analysisHistory.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "Saved analyses will appear here." })) : (analysisHistory.map((item) => (_jsxs("div", { className: `rounded-2xl border p-3 transition-colors ${analysisResult?.id === item.id ? "border-rose-300 bg-rose-50/70" : "border-slate-200 bg-slate-50/60"}`, children: [_jsxs("button", { type: "button", onClick: () => setAnalysisResult(item), className: "w-full text-left", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: item.fileName }), _jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [formatDate(item.createdAt), " | ", item.donationEligibility.label] })] }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }), _jsxs("div", { className: "mt-3 space-y-1 text-xs text-slate-600", children: [(item.parameters || []).slice(0, 3).map((parameter) => (_jsxs("p", { className: "truncate", children: [parameter.name, ": ", parameter.value, " ", parameter.unit, " (", parameter.status, ")"] }, `${item.id || item.fileName}-${parameter.slug}`))), item.parameters.length > 3 ? _jsx("p", { className: "text-slate-500", children: "Click to view full result" }) : null] })] }), _jsxs(Button, { type: "button", variant: "ghost", size: "sm", className: "mt-2 h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700", onClick: () => void deleteSavedAnalysis(item.id), children: [_jsx(Trash2, { className: "mr-1 h-4 w-4" }), "Delete"] })] }, item.id || `${item.fileName}-${item.createdAt}`)))) })] })] }), _jsx("div", { className: "space-y-4", children: analysisResult ? (_jsxs("div", { className: "overflow-hidden rounded-[30px] border border-slate-300 bg-white shadow-sm", children: [_jsx("div", { className: "border-b border-slate-300 bg-slate-100/90 px-4 py-4 sm:px-6", children: _jsx("div", { className: "flex flex-col gap-3 md:flex-row md:items-start md:justify-between", children: _jsx("div", { children: _jsx("p", { className: "text-lg font-semibold text-slate-900", children: analysisResult.fileName }) }) }) }), _jsxs("div", { className: "space-y-4 p-4 sm:p-6", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.2em] text-slate-500", children: "Parameters" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-slate-900", children: analysisResult.parameters.length })] }), _jsxs("div", { className: "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.2em] text-rose-500", children: "Out of range" }), _jsx("p", { className: "mt-1 text-lg font-semibold text-rose-700", children: analysisResult.parameters.filter((parameter) => parameter.status !== "normal").length })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3", children: [_jsx("p", { className: "text-[11px] uppercase tracking-[0.2em] text-slate-500", children: "Saved on" }), _jsx("p", { className: "mt-1 text-sm font-semibold text-slate-900", children: formatDate(analysisResult.createdAt) })] })] }), _jsx("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Plain-language summary", description: "Full report summary", body: analysisResult.summary }), className: "w-full rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50", children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Health Summary" }), _jsx("p", { className: "mt-2 line-clamp-3 text-sm leading-6 text-slate-600", children: analysisResult.summary })] }), _jsx(Eye, { className: "mt-1 h-4 w-4 shrink-0 text-slate-400" })] }) }), _jsxs("div", { className: "overflow-hidden rounded-[24px] border border-slate-200", children: [_jsxs("div", { className: "border-b border-slate-200 bg-slate-50 px-4 py-3", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Detected Parameters" }), _jsx("p", { className: "text-xs text-slate-500", children: "Click result to get more explanation." })] }), _jsx("div", { className: "divide-y divide-slate-200", children: analysisResult.parameters.map((parameter) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({
                                                                                        title: parameter.name,
                                                                                        description: `${parameter.value} ${parameter.unit} | ${parameter.referenceRange} | ${parameter.status}`,
                                                                                        body: parameter.explanation,
                                                                                    }), className: "grid w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[1.3fr_1fr_1fr_auto]", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900", children: parameter.name }), _jsx("p", { className: "mt-1 text-xs text-slate-500", children: parameter.referenceRange })] }), _jsxs("p", { className: "text-sm text-slate-700", children: [parameter.value, " ", parameter.unit] }), _jsx("p", { className: "text-sm text-slate-600 line-clamp-2", children: parameter.explanation }), _jsxs("div", { className: "flex items-center justify-between gap-3 sm:justify-end", children: [_jsx("span", { className: `rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getParameterTone(parameter.status)}`, children: parameter.status }), _jsx(Eye, { className: "h-4 w-4 text-slate-400" })] })] }, parameter.slug))) })] }), _jsxs(Collapsible, { open: isAnalysisGuidanceOpen, onOpenChange: setIsAnalysisGuidanceOpen, className: "rounded-[24px] border border-slate-200 bg-slate-50/70", children: [_jsx(CollapsibleTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "flex w-full items-center justify-between gap-3 px-4 py-4 text-left", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Detailed Guidance" }), _jsx("p", { className: "text-xs text-slate-500", children: "Open for eligibility notes, insights, diet, lifestyle, and disclaimer." })] }), isAnalysisGuidanceOpen ? _jsx(ChevronDown, { className: "h-4 w-4 text-slate-500" }) : _jsx(ChevronRight, { className: "h-4 w-4 text-slate-500" })] }) }), _jsxs(CollapsibleContent, { className: "space-y-4 border-t border-slate-200 px-4 py-4", children: [_jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-[24px] border border-amber-200 bg-amber-50/60 p-4", children: [_jsxs("p", { className: "flex items-center gap-2 text-sm font-semibold text-slate-900", children: [_jsx(ShieldAlert, { className: "h-4 w-4 text-amber-600" }), "Donation Eligibility"] }), _jsxs("div", { className: "mt-3 space-y-2", children: [analysisResult.donationEligibility.reasons.map((item, index) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Donation eligibility note", description: analysisResult.donationEligibility.label, body: item }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white", children: [_jsx("span", { children: item }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }, `${item}-${index}`))), analysisResult.donationEligibility.nextStep ? (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Recommended next step", description: analysisResult.donationEligibility.label, body: analysisResult.donationEligibility.nextStep || "" }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-100/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-amber-100", children: [_jsx("span", { children: analysisResult.donationEligibility.nextStep }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] })) : null] })] }), _jsxs("div", { className: "rounded-[24px] border border-rose-200 bg-rose-50/60 p-4", children: [_jsxs("p", { className: "flex items-center gap-2 text-sm font-semibold text-slate-900", children: [_jsx(Sparkles, { className: "h-4 w-4 text-rose-600" }), "Health Insights"] }), _jsxs("div", { className: "mt-3 space-y-2", children: [analysisResult.insights.map((item, index) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Health insight", description: analysisResult.fileName, body: item }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white", children: [_jsx("span", { children: item }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }, `${item}-${index}`))), analysisResult.precautions.map((item, index) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Precaution", description: "Follow-up safety note", body: item }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100", children: [_jsx("span", { children: item }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }, `${item}-${index}`)))] })] })] }), _jsxs("div", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Diet Recommendations" }), _jsx("div", { className: "mt-3 space-y-2", children: analysisResult.dietSuggestions.map((item, index) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Diet recommendation", description: analysisResult.fileName, body: item }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white", children: [_jsx("span", { children: item }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }, `${item}-${index}`))) })] }), _jsxs("div", { className: "rounded-[24px] border border-sky-200 bg-sky-50/60 p-4", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Lifestyle Tips" }), _jsx("div", { className: "mt-3 space-y-2", children: analysisResult.lifestyleSuggestions.map((item, index) => (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Lifestyle tip", description: analysisResult.fileName, body: item }), className: "flex w-full items-start justify-between gap-3 rounded-2xl border border-sky-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white", children: [_jsx("span", { children: item }), _jsx(Eye, { className: "mt-0.5 h-4 w-4 shrink-0 text-slate-400" })] }, `${item}-${index}`))) })] })] }), analysisResult.disclaimer ? (_jsxs("button", { type: "button", onClick: () => setAnalysisDetail({ title: "Medical disclaimer", description: "Important note", body: analysisResult.disclaimer || "" }), className: "flex w-full items-start justify-between gap-3 rounded-[24px] border border-amber-200 bg-amber-50/90 p-4 text-left text-xs leading-6 text-amber-900 transition hover:bg-amber-50", children: [_jsx("span", { className: "line-clamp-3", children: analysisResult.disclaimer }), _jsx(Eye, { className: "mt-1 h-4 w-4 shrink-0 text-amber-700" })] })) : null] })] })] })] })) : (_jsx("div", { className: "flex min-h-[420px] items-center justify-center rounded-[30px] border border-dashed border-slate-300 bg-white/80 p-8 text-center", children: _jsxs("div", { className: "max-w-md space-y-3", children: [_jsx("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100", children: _jsx(FileText, { className: "h-7 w-7 text-rose-600" }) }), _jsx("p", { className: "text-lg font-semibold text-slate-900", children: "No analyzed report yet" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Upload a blood test report to generate a structured interpretation, health insights, and a blood donation suggestion." })] }) })) })] }) })] }) }) })), _jsx(Dialog, { open: Boolean(analysisDetail), onOpenChange: (open) => !open && setAnalysisDetail(null), children: _jsxs(DialogContent, { className: "sm:max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: analysisDetail?.title }), _jsx(DialogDescription, { children: analysisDetail?.description })] }), _jsx("div", { className: "max-h-[70vh] overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700", children: analysisDetail?.body })] }) }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Save, { className: "h-5 w-5 text-primary" }), "Profile Management"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Name" }), _jsx(Input, { value: profile.name, onChange: (e) => setProfile((p) => ({ ...p, name: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Email" }), _jsx(Input, { value: profile.email, disabled: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Age" }), _jsx(Input, { value: profile.age, placeholder: "24", type: "number", min: 18, onChange: (e) => setProfile((p) => ({ ...p, age: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Blood Group" }), _jsxs(Select, { value: profile.bloodGroup, onValueChange: (value) => setProfile((p) => ({ ...p, bloodGroup: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Blood group" }) }), _jsx(SelectContent, { children: bloodGroups.map((group) => _jsx(SelectItem, { value: group, children: group }, group)) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "City" }), _jsx(Input, { value: profile.city, placeholder: "Bengaluru", onChange: (e) => setProfile((p) => ({ ...p, city: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: profile.phone, placeholder: "+91 98765 43210", onChange: (e) => setProfile((p) => ({ ...p, phone: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Last Donation Date" }), _jsx(Input, { type: "date", value: profile.lastDonationDate, onChange: (e) => setProfile((p) => ({ ...p, lastDonationDate: e.target.value })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Available to Donate" }), _jsxs("div", { className: "flex h-10 items-center gap-3 rounded-md border px-3", children: [_jsx("button", { type: "button", role: "switch", "aria-checked": profile.isAvailable, "aria-label": "Toggle donor availability", onClick: () => setProfile((p) => ({ ...p, isAvailable: !p.isAvailable })), className: `inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${profile.isAvailable ? "bg-primary" : "bg-input"}`, children: _jsx("span", { className: `block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${profile.isAvailable ? "translate-x-5" : "translate-x-0"}` }) }), _jsx("span", { className: "text-sm text-muted-foreground", children: profile.isAvailable ? "Available" : "Unavailable" })] })] })] }), _jsx(Button, { onClick: saveProfile, disabled: isBusy, children: "Save Profile" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }), "Create Blood Request"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(Input, { placeholder: "Patient name", value: requestForm.patientName, onChange: (e) => setRequestForm((p) => ({ ...p, patientName: e.target.value })) }), _jsxs(Select, { value: requestForm.bloodGroup, onValueChange: (value) => setRequestForm((p) => ({ ...p, bloodGroup: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Blood group" }) }), _jsx(SelectContent, { children: bloodGroups.map((group) => _jsx(SelectItem, { value: group, children: group }, group)) })] }), _jsx(Input, { placeholder: "Units needed", type: "number", min: 1, value: requestForm.units, onChange: (e) => setRequestForm((p) => ({ ...p, units: e.target.value })) }), _jsx(Input, { placeholder: "Hospital name", value: requestForm.hospitalName, onChange: (e) => setRequestForm((p) => ({ ...p, hospitalName: e.target.value })) }), _jsx(Input, { placeholder: "Reason (e.g. surgery, accident)", value: requestForm.reason, onChange: (e) => setRequestForm((p) => ({ ...p, reason: e.target.value })) }), _jsx(Input, { placeholder: "City", value: requestForm.city, onChange: (e) => setRequestForm((p) => ({ ...p, city: e.target.value })) })] }), _jsx(Textarea, { className: "min-h-[64px]", placeholder: "Patient condition (e.g. emergency surgery tomorrow, ICU support needed)", value: requestForm.patientCondition, onChange: (e) => setRequestForm((p) => ({ ...p, patientCondition: e.target.value })) }), _jsx(Textarea, { placeholder: "Additional notes", value: requestForm.notes, onChange: (e) => setRequestForm((p) => ({ ...p, notes: e.target.value })) }), _jsx(Button, { onClick: submitRequest, disabled: isBusy, children: "Submit Request" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { id: "dashboard-notifications", className: "h-[380px] flex flex-col scroll-mt-24", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Building2, { className: "h-5 w-5 text-primary" }), "Nearby Hospitals"] }) }), _jsxs(CardContent, { className: "space-y-3 overflow-y-auto pr-1 text-sm", children: [displayNearbyHospitals.length === 0 && (_jsx("p", { className: "text-muted-foreground", children: "No nearby hospitals available for your current city." })), displayNearbyHospitals.map((hospital) => (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30", children: [_jsx("p", { className: "font-medium", children: hospital.name }), _jsx("p", { className: "text-muted-foreground", children: hospital.location || "Location not shared" }), _jsx("p", { className: "text-muted-foreground", children: hospital.phone || "Phone not shared" }), _jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: ["Stock: ", hospital.availableBloodGroups?.length ? hospital.availableBloodGroups.join(", ") : "No stock data"] })] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: hospital.name }), _jsx(DialogDescription, { children: "Hospital contact and blood stock details." })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Location" }), _jsx("p", { className: "text-muted-foreground", children: hospital.location || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Phone" }), _jsx("p", { className: "text-muted-foreground", children: hospital.phone || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Email" }), _jsx("p", { className: "text-muted-foreground", children: hospital.email || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Available Blood Groups" }), _jsx("p", { className: "text-muted-foreground", children: hospital.availableBloodGroups?.length ? hospital.availableBloodGroups.join(", ") : "No stock data" })] })] })] })] }, hospital.id)))] })] }), _jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Droplets, { className: "h-5 w-5 text-primary" }), "Available Blood Inventory"] }) }), _jsx(CardContent, { className: "overflow-y-auto pr-1", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground sticky top-0 bg-background", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Hospital" }), _jsx("th", { children: "Group" }), _jsx("th", { children: "Units" }), _jsx("th", { className: "text-right", children: "Action" })] }) }), _jsx("tbody", { children: displayAvailableBloodInfo.map((item) => (_jsxs("tr", { className: "group border-t transition-colors hover:bg-rose-50/70", children: [_jsx("td", { className: "py-3 font-medium transition-colors group-hover:text-rose-700", children: item.hospitalName }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: item.bloodGroup }), _jsx("td", { className: "py-3 transition-colors group-hover:text-foreground", children: item.units }), _jsx("td", { className: "py-3 text-right", children: _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { size: "sm", variant: "outline", className: "transition-colors group-hover:border-rose-300 group-hover:bg-white", children: "Contact" }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: item.hospitalName }), _jsx(DialogDescription, { children: "Blood inventory contact details" })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Available Blood" }), _jsxs("p", { className: "text-muted-foreground", children: [item.bloodGroup, " - ", item.units, " units"] })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Location" }), _jsx("p", { className: "text-muted-foreground", children: item.location || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Phone" }), _jsx("p", { className: "text-muted-foreground", children: item.phone || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Email" }), _jsx("p", { className: "text-muted-foreground", children: item.email || "Not shared" })] })] })] })] }) })] }, item.id))) })] }) }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-5 w-5 text-primary" }), "Notifications"] }) }), _jsx(CardContent, { className: "space-y-3 overflow-y-auto pr-1 text-sm", children: displayNotifications.map((item) => (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "w-full rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30", children: [_jsx("p", { className: "font-medium", children: item.title }), _jsx("p", { className: "mt-1 text-muted-foreground", children: item.message }), _jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: formatDate(item.createdAt) })] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: item.title }), _jsx(DialogDescription, { children: "Notification details" })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Summary" }), _jsx("p", { className: "text-muted-foreground", children: item.message })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Date" }), _jsx("p", { className: "text-muted-foreground", children: formatDate(item.createdAt) })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Details" }), _jsx("p", { className: "text-muted-foreground", children: item.details || "No additional details available." })] })] })] })] }, item.id))) })] }), _jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-500" }), "Emergency Matches"] }) }), _jsxs(CardContent, { className: "space-y-3 overflow-y-auto pr-1 text-sm", children: [displayEmergencyRequests.length === 0 && (_jsx("p", { className: "text-muted-foreground", children: "No emergency matches available right now for your blood group." })), displayEmergencyRequests.map((item) => (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs("button", { type: "button", className: "w-full rounded-lg border border-red-400/30 p-3 text-left transition-colors hover:border-red-400/50 hover:bg-red-50/40", children: [_jsx("p", { className: "font-medium", children: item.hospitalName }), _jsxs("p", { children: [item.bloodGroup, " - ", item.units, " units"] }), _jsx("p", { className: "text-muted-foreground", children: item.location || "Location not shared" }), _jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: ["Requested: ", formatDate(item.requestDate)] })] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: item.hospitalName }), _jsx(DialogDescription, { children: "Emergency request details and hospital contact information." })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Blood Requirement" }), _jsxs("p", { className: "text-muted-foreground", children: [item.bloodGroup, " - ", item.units, " units"] })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Status" }), _jsx("p", { className: "text-muted-foreground capitalize", children: item.status })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Requested On" }), _jsx("p", { className: "text-muted-foreground", children: formatDate(item.requestDate) })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Location" }), _jsx("p", { className: "text-muted-foreground", children: item.location || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Phone" }), _jsx("p", { className: "text-muted-foreground", children: item.phone || "Not shared" })] }), _jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { className: "font-medium", children: "Email" }), _jsx("p", { className: "text-muted-foreground", children: item.email || "Not shared" })] })] })] })] }, item.id)))] })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(HeartHandshake, { className: "h-5 w-5 text-primary" }), "Add Donation Record"] }) }), _jsxs(CardContent, { className: "space-y-4 overflow-y-auto pr-1", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(Input, { placeholder: "Hospital name", value: donationForm.hospitalName, onChange: (e) => setDonationForm((p) => ({ ...p, hospitalName: e.target.value })) }), _jsxs(Select, { value: donationForm.bloodGroup, onValueChange: (value) => setDonationForm((p) => ({ ...p, bloodGroup: value })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Blood group" }) }), _jsx(SelectContent, { children: bloodGroups.map((group) => _jsx(SelectItem, { value: group, children: group }, group)) })] }), _jsx(Input, { placeholder: "Units donated", type: "number", min: 1, value: donationForm.unitsDonated, onChange: (e) => setDonationForm((p) => ({ ...p, unitsDonated: e.target.value })) }), _jsx(Input, { type: "date", value: donationForm.donationDate, onChange: (e) => setDonationForm((p) => ({ ...p, donationDate: e.target.value })) })] }), _jsx(Button, { onClick: saveDonation, disabled: isBusy, children: "Save Donation" })] })] }), _jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Donation History" }) }), _jsx(CardContent, { className: "overflow-y-auto pr-1", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-left text-muted-foreground sticky top-0 bg-background", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2", children: "Hospital" }), _jsx("th", { children: "Group" }), _jsx("th", { children: "Units" }), _jsx("th", { children: "Date" })] }) }), _jsx("tbody", { children: displayDonationHistory.map((record, index) => (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "py-2", children: record.hospitalName }), _jsx("td", { children: record.bloodGroup }), _jsx("td", { children: record.unitsDonated }), _jsx("td", { children: formatDate(record.donationDate) })] }, record._id || `${record.hospitalName}-${index}`))) })] }) }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-2 gap-6", children: [_jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-5 w-5 text-primary" }), "Recent Activity"] }) }), _jsx(CardContent, { className: "space-y-3 overflow-y-auto pr-1 text-sm", children: displayRecentActivities.map((item) => (_jsxs("div", { className: "rounded-lg border p-3", children: [_jsx("p", { children: item.message }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: formatDate(item.createdAt) })] }, item.id))) })] }), _jsxs(Card, { className: "h-[380px] flex flex-col", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(ClipboardList, { className: "h-5 w-5 text-primary" }), "Blood Donation Guidelines"] }), _jsx(CardDescription, { children: "Important health information to review before donating blood." })] }), _jsx(CardContent, { className: "overflow-y-auto pr-1", children: _jsxs("div", { className: "rounded-3xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm", children: [_jsx("div", { className: "border-b border-slate-200 pb-3", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Pre-Donation Advisory" }), _jsx("p", { className: "text-xs text-slate-500", children: "Review these standard safety checks before proceeding." })] }) }), _jsx("div", { className: "mt-4 grid gap-3", children: donationGuidelines.map((guideline) => (_jsx("div", { className: "rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200", children: _jsx("p", { className: "text-sm leading-6 text-slate-700", children: guideline }) }, guideline))) })] }) })] })] })] }), _jsx(Footer, {})] }));
};
export default UserDashboard;
