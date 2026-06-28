import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
const NotFound = () => {
    const location = useLocation();
    useEffect(() => {
        console.error("404 Error: User tried to access non-existent route:", location.pathname);
    }, [location.pathname]);
    return (_jsxs("div", { className: "min-h-screen bg-background flex flex-col justify-between", children: [_jsx(Header, {}), _jsx("main", { className: "container flex-grow flex items-center justify-center py-16", children: _jsxs("div", { className: "max-w-md w-full text-center px-4", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx("div", { className: "p-4 bg-red-100 dark:bg-red-950/30 rounded-full text-red-600 dark:text-red-400", children: _jsx(AlertCircle, { className: "h-12 w-12" }) }) }), _jsx("h1", { className: "text-4xl font-bold mb-2", children: "404" }), _jsx("p", { className: "text-xl font-semibold mb-4", children: "Page Not Found" }), _jsx("p", { className: "text-muted-foreground mb-8", children: "The page you are looking for does not exist or has been moved." }), _jsx(Button, { asChild: true, className: "w-full", children: _jsx(Link, { to: "/", children: "Return to Home" }) })] }) }), _jsx(Footer, {})] }));
};
export default NotFound;
