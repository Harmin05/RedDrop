import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";
const Contact = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        email: "",
        type: "",
        message: "",
    });
    const onSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(apiUrl("/api/contact"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    type: form.type,
                    message: form.message,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Failed to submit contact form");
            }
            toast({
                title: "Submitted successfully",
                description: "Your message has been saved. We will get back to you soon.",
            });
            setForm({ name: "", email: "", type: "", message: "" });
        }
        catch (error) {
            toast({
                variant: "destructive",
                title: "Submission failed",
                description: error instanceof Error ? error.message : "Please try again.",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "container py-16", children: _jsxs("section", { className: "max-w-5xl mx-auto", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsxs("h1", { className: "text-3xl md:text-5xl font-bold mb-3", children: ["Contact ", _jsx("span", { className: "text-gradient", children: "Us" })] }), _jsx("p", { className: "text-muted-foreground", children: "Share your feedback, raise a query, or report a problem." })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(Card, { className: "rounded-2xl card-shadow", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-5", children: "Contact Details" }), _jsxs("ul", { className: "space-y-5 text-sm", children: [_jsxs("li", { className: "flex items-start gap-3", children: [_jsx(Phone, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Phone" }), _jsx("p", { className: "text-muted-foreground", children: "+91 1800 123 4567" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx(Mail, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Email" }), _jsx("p", { className: "text-muted-foreground", children: "support@reddrop.org" })] })] }), _jsxs("li", { className: "flex items-start gap-3", children: [_jsx(MapPin, { className: "h-5 w-5 text-primary mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Address" }), _jsxs("p", { className: "text-muted-foreground", children: ["LDRP Institute of Technology & Research,", _jsx("br", {}), "Near KH-5,", _jsx("br", {}), "Sector-15,", _jsx("br", {}), "Gandhinagar - 382015."] })] })] })] })] }) }), _jsx(Card, { className: "rounded-2xl card-shadow", children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-5", children: "Send a Message" }), _jsxs("form", { onSubmit: onSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-name", children: "Full Name" }), _jsx(Input, { id: "contact-name", value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Enter your name", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-email", children: "Email" }), _jsx(Input, { id: "contact-email", type: "email", value: form.email, onChange: (e) => setForm((prev) => ({ ...prev, email: e.target.value })), placeholder: "Enter your email", required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Type" }), _jsxs(Select, { value: form.type, onValueChange: (value) => setForm((prev) => ({ ...prev, type: value })), required: true, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Choose one" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "feedback", children: "Feedback" }), _jsx(SelectItem, { value: "query", children: "Query" }), _jsx(SelectItem, { value: "problem", children: "Problem" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact-message", children: "Message" }), _jsx(Textarea, { id: "contact-message", value: form.message, onChange: (e) => setForm((prev) => ({ ...prev, message: e.target.value })), placeholder: "Describe your feedback, query, or issue", className: "min-h-28", required: true })] }), _jsx(Button, { type: "submit", variant: "hero", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Submitting..." : "Submit" })] })] }) })] })] }) }), _jsx(Footer, {})] }));
};
export default Contact;
