import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center text-muted-foreground", children: "Loading..." }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/auth", replace: true, state: { from: location } });
    }
    return children;
};
export default ProtectedRoute;
