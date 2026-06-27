import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const HAS_REMOTE_CHAT_CONFIG = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const QUICK_REPLIES = [
    { label: "🩸 Who can donate?", message: "Who is eligible to donate blood?" },
    { label: "⏰ How often?", message: "How often can I donate blood?" },
    { label: "🔬 Blood types", message: "What are the different blood types and their compatibility?" },
    { label: "📍 Find donors", message: "How can I find blood donors near me?" },
    { label: "🏥 Emergency", message: "How do I request blood in an emergency?" },
    { label: "💪 Benefits", message: "What are the health benefits of donating blood?" },
];
const matchesAny = (text, phrases) => phrases.some((phrase) => text.includes(phrase));
const buildFallbackReply = (question) => {
    const normalizedQuestion = question.toLowerCase().trim();
    const lettersOnly = normalizedQuestion.replace(/[^a-z]/g, "");
    if (matchesAny(normalizedQuestion, ["hi", "hello", "hey", "hii", "helo"])) {
        return "Hi! I'm here to help with blood donation questions. You can ask me things like who can donate, how often someone can donate, blood group compatibility, or how to find donors quickly.";
    }
    if (matchesAny(normalizedQuestion, ["how are you", "who are you"])) {
        return "I'm the RedDrop Assistant. I help with blood donation questions in a simple way, like eligibility, blood types, donation timing, and emergency guidance.";
    }
    if (normalizedQuestion.length < 3 || (lettersOnly.length > 0 && !/[aeiou]/.test(lettersOnly) && lettersOnly.length > 5)) {
        return "I didn’t fully understand that message. Try asking in a simple way like: who can donate blood, what is O positive compatibility, can I donate after a tattoo, or how to find blood urgently.";
    }
    if (matchesAny(normalizedQuestion, [
        "eligible",
        "who can donate",
        "can donate",
        "am i eligible",
        "requirements",
        "criteria",
    ])) {
        return "Most healthy adults can donate blood if they feel well, meet the local age and weight rules, and have a safe hemoglobin level. Someone may need to wait for a while after fever, infection, tattoo, surgery, pregnancy, or some medicines. If you want, I can give you a quick eligibility checklist step by step.";
    }
    if (matchesAny(normalizedQuestion, ["how often", "wait between", "donate again", "next donation", "donation interval"])) {
        return "For whole blood, people are commonly allowed to donate about every 56 days, although the exact rule can vary by center. Platelet or plasma donation may be allowed more often. If you want, I can explain the timing for each type of donation.";
    }
    if (matchesAny(normalizedQuestion, ["blood type", "blood group", "compatibility", "compatible", "abo", "rh factor"])) {
        return "There are four main blood groups: A, B, AB, and O, and each can be positive or negative. O negative is often used in emergencies because it can donate red cells to many people, while AB positive can usually receive from all groups. If you want, I can show you a simple blood compatibility chart.";
    }
    if (matchesAny(normalizedQuestion, [
        "find donor",
        "find blood",
        "near me",
        "nearby",
        "search donor",
        "blood bank",
        "hospital",
    ])) {
        return "To find donors quickly, contact nearby blood banks, hospital transfusion centers, and local donor groups at the same time. When you share the request, include the blood group, number of units needed, hospital name, and contact number clearly. If it is urgent, reach out to the nearest hospital immediately as well.";
    }
    if (matchesAny(normalizedQuestion, ["emergency", "urgent", "asap", "critical", "need blood now"])) {
        return "If blood is needed urgently, contact the nearest hospital blood bank right away and share the blood group, units needed, and exact hospital location. It also helps to use donor networks in parallel instead of waiting on only one source. If this is life-threatening, go to the nearest hospital or contact emergency services immediately.";
    }
    if (matchesAny(normalizedQuestion, ["benefit", "advantages", "why donate", "why should i donate"])) {
        return "Blood donation helps save lives, and donors also often get basic checks like pulse, blood pressure, and hemoglobin screening. Many people feel good knowing they helped someone in need. After donating, it’s best to drink fluids, eat something light, and rest for a bit.";
    }
    if (matchesAny(normalizedQuestion, ["tattoo", "piercing"])) {
        return "After a tattoo or piercing, many centers ask you to wait for a period before donating blood. The exact waiting time depends on local rules and where the procedure was done, so it’s best to check with the blood bank before you go.";
    }
    if (matchesAny(normalizedQuestion, ["fever", "cold", "flu", "infection", "sick"])) {
        return "If you currently have fever, flu, cold symptoms, or any active infection, you should usually wait until you feel fully well before donating. Blood centers want donors to be healthy on the day of donation.";
    }
    if (matchesAny(normalizedQuestion, ["pregnant", "pregnancy", "breastfeeding"])) {
        return "Pregnant people should not donate blood. After delivery, blood donation is usually delayed for some time, and breastfeeding rules can vary by center. The safest option is to confirm with the blood bank before donating.";
    }
    if (matchesAny(normalizedQuestion, ["diabetes", "bp", "blood pressure", "hypertension", "sugar"])) {
        return "People with diabetes or blood pressure issues may still be able to donate if the condition is stable and they feel well, but it depends on medicines, control level, and local screening rules. If you tell me the specific condition, I can answer more clearly.";
    }
    if (matchesAny(normalizedQuestion, ["hemoglobin", "hb", "iron", "anemia"])) {
        return "Hemoglobin must be above the blood center’s minimum level before donation. If someone has anemia or low hemoglobin, they may be asked to wait and improve iron levels first.";
    }
    if (matchesAny(normalizedQuestion, ["before donation", "prepare", "what should i do before"])) {
        return "Before donating blood, drink enough water, eat a light meal, sleep well the night before, and carry an ID if your center requires it. It also helps to avoid donating on an empty stomach.";
    }
    if (matchesAny(normalizedQuestion, ["after donation", "care after", "what should i do after"])) {
        return "After donating, drink fluids, rest for a short while, avoid heavy exercise for the day, and eat something light if offered. If you feel dizzy, sit or lie down and let the staff know.";
    }
    if (matchesAny(normalizedQuestion, ["platelet", "plasma"])) {
        return "Platelet and plasma donation are different from whole blood donation and may have different timing, eligibility, and equipment requirements. If you want, I can explain the difference in a very simple way.";
    }
    return "I'm here to help with blood donation questions. Ask me anything like who can donate, how often donation is allowed, blood group compatibility, or how to find blood donors in an emergency, and I’ll answer in a simple way.";
};
export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hi! I'm the RedDrop Assistant. How can I help you today? I can answer questions about blood donation, eligibility, blood types, and more.",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(true);
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);
    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading)
            return;
        const userMessage = { role: "user", content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setShowQuickReplies(false);
        let assistantContent = "";
        try {
            if (!HAS_REMOTE_CHAT_CONFIG) {
                throw new Error("Remote chat is not configured");
            }
            const response = await fetch(CHAT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ messages: [...messages, userMessage] }),
            });
            if (!response.ok || !response.body) {
                throw new Error("Failed to get response");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let textBuffer = "";
            const updateAssistant = (content) => {
                assistantContent = content;
                setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant" && prev.length > 1) {
                        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
                    }
                    return [...prev, { role: "assistant", content }];
                });
            };
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                textBuffer += decoder.decode(value, { stream: true });
                let newlineIndex;
                while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
                    let line = textBuffer.slice(0, newlineIndex);
                    textBuffer = textBuffer.slice(newlineIndex + 1);
                    if (line.endsWith("\r"))
                        line = line.slice(0, -1);
                    if (line.startsWith(":") || line.trim() === "")
                        continue;
                    if (!line.startsWith("data: "))
                        continue;
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === "[DONE]")
                        break;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            assistantContent += content;
                            updateAssistant(assistantContent);
                        }
                    }
                    catch {
                        textBuffer = line + "\n" + textBuffer;
                        break;
                    }
                }
            }
        }
        catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: buildFallbackReply(text) },
            ]);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleQuickReply = (message) => {
        sendMessage(message);
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setIsOpen(!isOpen), className: cn("fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full blood-gradient shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110", isOpen && "rotate-180"), "aria-label": "Toggle chat", children: isOpen ? (_jsx(X, { className: "h-6 w-6 text-primary-foreground" })) : (_jsx(MessageCircle, { className: "h-6 w-6 text-primary-foreground" })) }), _jsxs("div", { className: cn("fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-card shadow-2xl transition-all duration-300 overflow-hidden", isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"), children: [_jsx("div", { className: "blood-gradient p-4 text-primary-foreground", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-10 w-10 rounded-full bg-white/20 flex items-center justify-center", children: _jsx(Bot, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: "RedDrop Assistant" }), _jsx("p", { className: "text-xs opacity-80", children: "Ask me anything about blood donation" })] })] }) }), _jsx(ScrollArea, { className: "h-[350px] p-4", ref: scrollRef, children: _jsxs("div", { className: "space-y-4", children: [messages.map((message, index) => (_jsxs("div", { className: cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start"), children: [message.role === "assistant" && (_jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Bot, { className: "h-4 w-4 text-primary" }) })), _jsx("div", { className: cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm", message.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-md"
                                                : "bg-muted rounded-bl-md"), children: message.role === "assistant" ? (_jsx("div", { className: "prose prose-sm dark:prose-invert max-w-none", children: _jsx(ReactMarkdown, { children: message.content }) })) : (message.content) }), message.role === "user" && (_jsx("div", { className: "h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0", children: _jsx(User, { className: "h-4 w-4 text-primary-foreground" }) }))] }, index))), isLoading && messages[messages.length - 1]?.role === "user" && (_jsxs("div", { className: "flex gap-2 justify-start", children: [_jsx("div", { className: "h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Bot, { className: "h-4 w-4 text-primary" }) }), _jsx("div", { className: "bg-muted rounded-2xl rounded-bl-md px-4 py-2", children: _jsxs("div", { className: "flex gap-1", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-primary/50 animate-bounce", style: { animationDelay: "0ms" } }), _jsx("span", { className: "h-2 w-2 rounded-full bg-primary/50 animate-bounce", style: { animationDelay: "150ms" } }), _jsx("span", { className: "h-2 w-2 rounded-full bg-primary/50 animate-bounce", style: { animationDelay: "300ms" } })] }) })] }))] }) }), showQuickReplies && !isLoading && (_jsxs("div", { className: "border-t px-4 py-3", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "Quick questions:" }), _jsx("div", { className: "flex flex-wrap gap-2", children: QUICK_REPLIES.map((reply, index) => (_jsx("button", { onClick: () => handleQuickReply(reply.message), className: "text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors", children: reply.label }, index))) })] })), _jsx("div", { className: "border-t p-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: handleKeyDown, placeholder: "Type your message...", disabled: isLoading, className: "flex-1" }), _jsx(Button, { onClick: () => sendMessage(), disabled: !input.trim() || isLoading, size: "icon", variant: "hero", children: _jsx(Send, { className: "h-4 w-4" }) })] }) })] })] }));
}
