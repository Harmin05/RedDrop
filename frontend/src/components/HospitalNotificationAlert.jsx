import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { apiUrl } from "@/lib/api";
import { useNavigate } from "react-router-dom";
const HospitalNotificationAlert = () => {
    const { user, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isDismissed, setIsDismissed] = useState(false);
    const navigate = useNavigate();
    const isHospital = isAuthenticated && user?.role === "hospital";
    const loadNotifications = useCallback(async () => {
        if (!isHospital) {
            setNotifications([]);
            return;
        }
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token)
            return;
        try {
            const res = await fetch(apiUrl("/api/dashboard/notifications"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok)
                return;
            const data = await res.json();
            setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
        }
        catch {
            // keep alert unobtrusive if fetch fails
        }
    }, [isHospital]);
    useEffect(() => {
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 20000);
        return () => window.clearInterval(interval);
    }, [loadNotifications]);
    useEffect(() => {
        if (notifications.length > 0) {
            setIsDismissed(false);
        }
    }, [notifications.length]);
    if (!isHospital || notifications.length === 0 || isDismissed) {
        return null;
    }
    return (_jsx("div", { className: "fixed bottom-6 left-6 z-[70]", children: _jsxs("div", { className: "relative", children: [_jsxs("button", { type: "button", onClick: () => navigate("/hospital-dashboard#dashboard-notifications"), className: "group flex items-center gap-3 rounded-full border bg-card/95 px-4 py-2.5 pr-9 shadow-lg backdrop-blur hover:border-primary/40 transition-colors", "aria-label": "Open hospital dashboard notifications", children: [_jsxs("div", { className: "relative", children: [_jsx(Bell, { className: "h-5 w-5 text-primary group-hover:scale-105 transition-transform" }), _jsx("span", { className: "absolute -top-1.5 -right-2 min-w-[18px] h-[18px] rounded-full bg-destructive text-[10px] text-white flex items-center justify-center px-1", children: notifications.length })] }), _jsxs("div", { className: "text-left leading-tight", children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Hospital Alerts" }), _jsx("p", { className: "text-sm font-medium", children: "Open new notifications" })] })] }), _jsx("button", { type: "button", onClick: (e) => {
                        e.stopPropagation();
                        setIsDismissed(true);
                    }, className: "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border bg-background/90 hover:border-primary/40 flex items-center justify-center", "aria-label": "Dismiss notification alert", children: _jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground" }) })] }) }));
};
export default HospitalNotificationAlert;
