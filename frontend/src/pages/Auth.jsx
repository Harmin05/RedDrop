import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, Mail, Lock, User, Eye, EyeOff, Building2, Phone, MapPin, FileBadge2, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters");
const requiredText = (label) => z.string().trim().min(1, `${label} is required`);
const Auth = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [activeTab, setActiveTab] = useState("signin");
    const [role, setRole] = useState("user");
    const [hospitalForm, setHospitalForm] = useState({
        name: "",
        phone: "",
        location: "",
        licenseNumber: "",
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const parseResponse = async (res) => {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return res.json();
        }
        const text = await res.text();
        return { message: text || "Unexpected server response" };
    };
    useEffect(() => {
        const mode = searchParams.get("mode");
        const roleParam = searchParams.get("role");
        setActiveTab(mode === "signup" ? "signup" : "signin");
        setRole(roleParam === "hospital" ? "hospital" : "user");
        setErrors({});
    }, [searchParams]);
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);
    const validateForm = (isSignUp) => {
        const newErrors = {};
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success)
            newErrors.email = emailResult.error.errors[0].message;
        const passwordResult = passwordSchema.safeParse(password);
        if (!passwordResult.success)
            newErrors.password = passwordResult.error.errors[0].message;
        if (isSignUp) {
            if (role === "user") {
                const nameResult = nameSchema.safeParse(fullName);
                if (!nameResult.success)
                    newErrors.name = nameResult.error.errors[0].message;
            }
            else {
                const hospitalNameResult = nameSchema.safeParse(hospitalForm.name);
                if (!hospitalNameResult.success)
                    newErrors.name = hospitalNameResult.error.errors[0].message;
                const phoneResult = requiredText("Phone number").safeParse(hospitalForm.phone);
                if (!phoneResult.success)
                    newErrors.phone = phoneResult.error.errors[0].message;
                const locationResult = requiredText("Location").safeParse(hospitalForm.location);
                if (!locationResult.success)
                    newErrors.location = locationResult.error.errors[0].message;
                const licenseResult = requiredText("License number").safeParse(hospitalForm.licenseNumber);
                if (!licenseResult.success)
                    newErrors.licenseNumber = licenseResult.error.errors[0].message;
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSignIn = async (e) => {
        e.preventDefault();
        if (!validateForm(false))
            return;
        setIsSubmitting(true);
        try {
            const endpoint = role === "hospital" ? "/api/hospitals/auth/login" : "/api/login";
            const res = await fetch(apiUrl(endpoint), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await parseResponse(res);
            if (data.token) {
                localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                toast({
                    title: "Welcome back!",
                    description: role === "hospital" ? "Hospital login successful." : "Login successful.",
                });
                navigate("/");
            }
            else {
                toast({
                    variant: "destructive",
                    title: "Login Failed",
                    description: data?.message || "Unable to sign in",
                });
            }
        }
        catch (error) {
            const description = error instanceof Error && error.message.includes("Failed to fetch")
                ? `Cannot connect to backend at ${apiUrl("/api/health")}`
                : "Server error. Try again.";
            toast({ variant: "destructive", title: "Error", description });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!validateForm(true))
            return;
        setIsSubmitting(true);
        try {
            const endpoint = role === "hospital" ? "/api/hospitals/auth/register" : "/api/register";
            const payload = role === "hospital"
                ? {
                    name: hospitalForm.name,
                    phone: hospitalForm.phone,
                    email,
                    location: hospitalForm.location,
                    licenseNumber: hospitalForm.licenseNumber,
                    password,
                }
                : {
                    name: fullName,
                    email,
                    password,
                };
            const res = await fetch(apiUrl(endpoint), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await parseResponse(res);
            if (res.ok) {
                if (data?.token) {
                    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
                    toast({
                        title: "Account Created!",
                        description: "You are now logged in.",
                    });
                    navigate("/");
                    return;
                }
                toast({
                    title: "Account Created!",
                    description: role === "hospital"
                        ? "Hospital account created. You can now log in."
                        : "You can now log in.",
                });
                setActiveTab("signin");
            }
            else {
                toast({
                    variant: "destructive",
                    title: "Sign Up Failed",
                    description: data?.message || "Unable to create account",
                });
            }
        }
        catch (error) {
            const description = error instanceof Error && error.message.includes("Failed to fetch")
                ? `Cannot connect to backend at ${apiUrl("/api/health")}`
                : "Server error. Try again.";
            toast({ variant: "destructive", title: "Error", description });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-md", children: [_jsxs("a", { href: "/", className: "flex items-center justify-center gap-2 mb-8", children: [_jsx(Heart, { className: "h-10 w-10 text-primary animate-heartbeat", fill: "currentColor" }), _jsx("span", { className: "text-2xl font-bold text-gradient", children: "RedDrop" })] }), _jsxs("div", { className: "flex justify-center gap-2 mb-4", children: [_jsx(Button, { variant: role === "user" ? "default" : "outline", size: "sm", asChild: true, children: _jsx(Link, { to: `/auth?mode=${activeTab}&role=user`, children: "User" }) }), _jsx(Button, { variant: role === "hospital" ? "default" : "outline", size: "sm", asChild: true, children: _jsx(Link, { to: `/auth?mode=${activeTab}&role=hospital`, children: "Hospital" }) })] }), _jsxs(Card, { className: "border-2", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-2xl", children: role === "hospital" ? "Hospital Access" : "Welcome" }), _jsx(CardDescription, { children: role === "hospital"
                                        ? "Sign in or create a hospital account"
                                        : "Sign in or create a new account" })] }), _jsx(CardContent, { children: _jsxs(Tabs, { value: activeTab, onValueChange: (value) => setActiveTab(value), className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2 mb-6", children: [_jsx(TabsTrigger, { value: "signin", children: "Sign In" }), _jsx(TabsTrigger, { value: "signup", children: "Sign Up" })] }), _jsx(TabsContent, { value: "signin", children: _jsxs("form", { onSubmit: handleSignIn, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: role === "hospital" ? "Hospital Email" : "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10" })] }), errors.email && _jsx("p", { className: "text-sm text-destructive", children: errors.email })] }), _jsxs("div", { children: [_jsx(Label, { children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), className: "pl-10 pr-10" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-3", children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), errors.password && _jsx("p", { className: "text-sm text-destructive", children: errors.password })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Signing in..." : "Sign In" })] }) }), _jsx(TabsContent, { value: "signup", children: _jsxs("form", { onSubmit: handleSignUp, className: "space-y-4", children: [role === "user" ? (_jsxs("div", { children: [_jsx(Label, { children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", value: fullName, onChange: (e) => setFullName(e.target.value), className: "pl-10" })] }), errors.name && _jsx("p", { className: "text-sm text-destructive", children: errors.name })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx(Label, { children: "Hospital Name" }), _jsxs("div", { className: "relative", children: [_jsx(Building2, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", value: hospitalForm.name, onChange: (e) => setHospitalForm({ ...hospitalForm, name: e.target.value }), className: "pl-10", placeholder: "Enter hospital name" })] }), errors.name && _jsx("p", { className: "text-sm text-destructive", children: errors.name })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "tel", value: hospitalForm.phone, onChange: (e) => setHospitalForm({ ...hospitalForm, phone: e.target.value }), className: "pl-10", placeholder: "+91 98765 43210" })] }), errors.phone && _jsx("p", { className: "text-sm text-destructive", children: errors.phone })] }), _jsxs("div", { children: [_jsx(Label, { children: "License Number" }), _jsxs("div", { className: "relative", children: [_jsx(FileBadge2, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", value: hospitalForm.licenseNumber, onChange: (e) => setHospitalForm({ ...hospitalForm, licenseNumber: e.target.value }), className: "pl-10", placeholder: "Hospital license number" })] }), errors.licenseNumber && (_jsx("p", { className: "text-sm text-destructive", children: errors.licenseNumber }))] }), _jsxs("div", { children: [_jsx(Label, { children: "Hospital Address" }), _jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", value: hospitalForm.location, onChange: (e) => setHospitalForm({ ...hospitalForm, location: e.target.value }), className: "pl-10", placeholder: "Full hospital address" })] }), errors.location && _jsx("p", { className: "text-sm text-destructive", children: errors.location })] })] })), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10" })] }), errors.email && _jsx("p", { className: "text-sm text-destructive", children: errors.email })] }), _jsxs("div", { children: [_jsx(Label, { children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), className: "pl-10 pr-10" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-3", children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), errors.password && _jsx("p", { className: "text-sm text-destructive", children: errors.password })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Creating account..." : "Create Account" })] }) })] }) })] })] }) }));
};
export default Auth;
