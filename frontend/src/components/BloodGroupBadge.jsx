import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
const BloodGroupBadge = ({ bloodGroup, size = "md", className }) => {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-lg",
    };
    return (_jsx("div", { className: cn("blood-gradient rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-md", sizeClasses[size], className), children: bloodGroup }));
};
export default BloodGroupBadge;
