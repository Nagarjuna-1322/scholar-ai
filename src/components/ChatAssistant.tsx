"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProfile } from "@/contexts/ProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  Globe2,
  User,
  RotateCcw,
  Copy,
  Check,
  Bookmark,
  Scale,
  ExternalLink,
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  FileUp,
  MapPin,
  FileText,
  ArrowRight,
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface SuggestedScholarshipCard {
  id: number | string;
  title: string;
  provider: string;
  amount: number;
  deadline: string;
  link: string;
  region: string;
  verification_status: string;
  status: "Eligible" | "Possibly Eligible" | "Not Eligible";
  compatibilityScore: number;
  summaryReason: string;
}

export interface WorkflowActionLink {
  label: string;
  href: string;
}

export interface SearchSourceLink {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestedScholarships?: SuggestedScholarshipCard[];
  workflowAction?: WorkflowActionLink;
  searchSources?: SearchSourceLink[];
}

const CHAT_STORAGE_KEY = "scholarai_chat_clean_v3";

const QUICK_REPLY_BUTTONS = [
  {
    label: "Check Eligibility",
    prompt: "Check my eligibility and show which scholarships I can apply for right now.",
    icon: CheckCircle2,
    workflowAction: {
      label: "Open Check My Eligibility",
      href: "/ai-matcher",
    },
  },
  {
    label: "View Deadlines",
    prompt: "Show upcoming scholarship deadlines sorted by closing date for my profile.",
    icon: Calendar,
    workflowAction: {
      label: "Browse All Scholarships",
      href: "/dashboard#scholarship-directory-section",
    },
  },
  {
    label: "Upload Documents",
    prompt: "What documents do I need to upload to verify my scholarship eligibility?",
    icon: FileUp,
    workflowAction: {
      label: "Upload Resume / Docs in Check Eligibility",
      href: "/ai-matcher",
    },
  },
  {
    label: "State Scholarships",
    prompt: "Show Telangana ePASS, MahaDBT, and State portal scholarships for my profile.",
    icon: MapPin,
    workflowAction: {
      label: "Explore State Scholarships",
      href: "/recommendations",
    },
  },
  {
    label: "Essay / SOP Help",
    prompt: "How do I write a strong scholarship Statement of Purpose (SOP) for my course?",
    icon: FileText,
  },
];

/**
 * Formats markdown-like bold (**text**) into clean React nodes without raw asterisks.
 */
function renderFormattedChatText(rawText: string) {
  const cleaned = rawText.replace(/^###\s+/gm, "");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function ChatAssistant({
  mode = "floating",
  onClose,
}: {
  mode?: "card" | "floating" | "fullpage";
  onClose?: () => void;
}) {
  const { profile } = useProfile();
  const { language, setLanguage } = useLanguage();
  const { savedIds, toggleSavedScholarship, comparisonIds, toggleCompareScholarship } =
    useScholarships();
  const { getStatus, setStatus } = useApplicationTracker();
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const defaultGreeting: ChatMessage = {
    id: "welcome-msg",
    sender: "bot",
    text: `Hi ${
      profile.name || "there"
    }! I am your **ScholarAI Chatbot**. Ask me in **English**, **Hindi (हिन्दी)**, or **Telugu (తెలుగు)**:\n• Which scholarships can I apply for right now?\n• What scholarships are open in **${profile.state || "my state"}**?\n• What documents do I need to apply?`,
    timestamp: "Online",
  };

  const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.removeItem("scholarai_chatbot_messages_v2");
      const saved = window.localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-25)));
    } catch {}
    if (scrollAreaRef.current) {
      const viewport =
        scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") ||
        scrollAreaRef.current.querySelector("div");
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const sendQuestion = async (questionText: string, workflowAction?: WorkflowActionLink) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: nowTime,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setText("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "advisor_chat",
          message: trimmed,
          language,
          profile,
          history: updatedHistory.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });
      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text:
          data.reply ||
          "Please check the Check My Eligibility page for your full scholarship match list.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedScholarships: Array.isArray(data.suggestedScholarships)
          ? data.suggestedScholarships
          : undefined,
        workflowAction,
        searchSources: Array.isArray(data.searchSources) && data.searchSources.length > 0
          ? data.searchSources.slice(0, 3)
          : undefined,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "I couldn't reach the server right now, but your scholarship matches are ready on the Dashboard!",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          workflowAction,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const fresh: ChatMessage = {
      ...defaultGreeting,
      id: `welcome-${Date.now()}`,
      timestamp: "Online",
    };
    setMessages([fresh]);
    try {
      window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([fresh]));
    } catch {}
    toast({
      title: "Chat Cleared",
      description: "Started a fresh conversation.",
    });
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.text.replace(/\*\*/g, ""));
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePortalClick = (s: SuggestedScholarshipCard) => {
    const current = getStatus(s.id);
    if (
      !current ||
      current === "Saved" ||
      current === "Preparing Documents" ||
      current === "Ready to Apply"
    ) {
      setStatus(s.id, "Application Started", "Opened official portal from AI Chatbot");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendQuestion(text);
    }
  };

  const scrollHeightClass =
    mode === "fullpage"
      ? "h-[480px] sm:h-[540px]"
      : "h-[330px]";

  return (
    <Card
      className={cn(
        "border-indigo-200/80 dark:border-indigo-900/60 shadow-md overflow-hidden flex flex-col",
        mode === "floating" && "border-2 border-primary/30 shadow-2xl"
      )}
    >
      {/* Clean Chatbot Header Bar */}
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="relative p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Bot className="h-5 w-5" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-950" />
            </div>
            <div>
              <CardTitle className="font-headline flex items-center gap-1.5 text-sm sm:text-base text-white">
                <span>ScholarAI Chatbot</span>
                <Badge
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                >
                  <Sparkles className="h-2.5 w-2.5 mr-1" />
                  Online
                </Badge>
              </CardTitle>
              <CardDescription className="text-[11px] text-indigo-200">
                Ask about scholarships, eligibility & required documents
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Language Switcher */}
            <div className="flex items-center bg-white/10 rounded-md p-0.5 mr-1">
              <Globe2 className="h-3 w-3 text-indigo-200 mx-1" />
              {(["en", "hi", "te"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    language === lang
                      ? "bg-amber-400 text-slate-950"
                      : "text-indigo-100 hover:bg-white/10"
                  }`}
                >
                  {lang === "en" ? "EN" : lang === "hi" ? "हिं" : "తె"}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearChat}
              title="Reset chat history"
              className="h-7 w-7 text-indigo-100 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>

            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Minimize chatbot"
                className="h-7 w-7 text-indigo-100 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 flex flex-col space-y-3 bg-card flex-1">
        {/* Chat Messages Stream */}
        <ScrollArea
          className={cn(
            "pr-3 border rounded-xl p-3 bg-slate-50/70 dark:bg-slate-950/40",
            scrollHeightClass
          )}
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-2.5",
                  msg.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.sender === "bot" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-950 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[86%] space-y-2",
                    msg.sender === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words shadow-2xs",
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-card border text-foreground rounded-bl-xs"
                    )}
                  >
                    {renderFormattedChatText(msg.text)}

                    {msg.sender === "bot" && msg.searchSources && msg.searchSources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Google Search Grounded Sources:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.searchSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline bg-primary/5 px-2 py-0.5 rounded border border-primary/20"
                            >
                              <span className="truncate max-w-[160px]">{src.title}</span>
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.sender === "bot" && msg.workflowAction && (
                      <div className="mt-2.5 pt-2 border-t border-border/60">
                        <Button
                          asChild
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2.5 text-[11px] font-semibold gap-1.5 w-full sm:w-auto"
                        >
                          <Link href={msg.workflowAction.href}>
                            <span>{msg.workflowAction.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 mt-1.5 pt-1 border-t text-[10px]",
                        msg.sender === "user"
                          ? "border-primary-foreground/20 text-primary-foreground/80"
                          : "border-border/60 text-muted-foreground"
                      )}
                    >
                      <span>{msg.timestamp}</span>
                      {msg.sender === "bot" && (
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          title="Copy reply"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interactive Scholarship Cards inside Bot Message */}
                  {msg.sender === "bot" &&
                    msg.suggestedScholarships &&
                    msg.suggestedScholarships.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {msg.suggestedScholarships.map((s) => {
                          const isSaved = savedIds.some(
                            (id) => String(id) === String(s.id)
                          );
                          const isCompared = comparisonIds.some(
                            (id) => String(id) === String(s.id)
                          );
                          return (
                            <div
                              key={s.id}
                              className="p-2.5 rounded-xl border bg-background/95 hover:border-primary/50 transition-all shadow-2xs space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-bold text-foreground leading-snug">
                                    {s.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {s.provider} • {s.region}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="font-mono font-bold text-[10px] text-primary border-primary/30 shrink-0"
                                >
                                  ₹{Number(s.amount).toLocaleString("en-IN")}/yr
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between gap-2 flex-wrap text-[10px]">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded",
                                    s.status === "Eligible"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : s.status === "Possibly Eligible"
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                  )}
                                >
                                  {s.status === "Eligible" ? (
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                  ) : (
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                  )}
                                  {s.status} ({s.compatibilityScore}% Match)
                                </span>
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <ShieldCheck className="h-2.5 w-2.5 text-emerald-600" />
                                  Deadline: {s.deadline}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1.5 pt-1 border-t">
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isSaved ? "secondary" : "outline"}
                                    onClick={() => toggleSavedScholarship(s.id)}
                                    className="h-6 px-2 text-[10px] gap-1"
                                  >
                                    <Bookmark
                                      className={cn(
                                        "h-2.5 w-2.5",
                                        isSaved && "fill-current text-primary"
                                      )}
                                    />
                                    <span>{isSaved ? "Saved" : "Save"}</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isCompared ? "secondary" : "outline"}
                                    onClick={() => toggleCompareScholarship(s.id)}
                                    className="h-6 px-2 text-[10px] gap-1"
                                  >
                                    <Scale className="h-2.5 w-2.5 text-indigo-600" />
                                    <span>{isCompared ? "Comparing" : "Compare"}</span>
                                  </Button>
                                </div>

                                <Button
                                  asChild
                                  size="sm"
                                  className="h-6 px-2.5 text-[10px] gap-1"
                                >
                                  <a
                                    href={s.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handlePortalClick(s)}
                                  >
                                    <span>Apply Portal</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-2 rounded-lg bg-muted/40 w-fit">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Finding scholarships for you...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick-Reply Workflow Buttons above the Input Field */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {QUICK_REPLY_BUTTONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => sendQuestion(item.prompt, item.workflowAction)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border bg-muted/60 hover:bg-primary/10 hover:border-primary/40 hover:text-primary text-foreground transition-colors disabled:opacity-50"
              >
                <Icon className="h-3 w-3 text-primary shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === "te"
                ? "స్కాలర్‌షిప్‌లు, అర్హత లేదా పత్రాల గురించి అడగండి..."
                : language === "hi"
                ? "छात्रवृत्ति, पात्रता या दस्तावेज़ के बारे में पूछें..."
                : "Ask about scholarships, eligibility, or documents..."
            }
            className="text-xs h-10 bg-background"
          />
          <Button
            size="sm"
            onClick={() => sendQuestion(text)}
            disabled={!text.trim() || isLoading}
            aria-label="Send message"
            className="h-10 px-4 gap-1.5 font-semibold"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Global Floating AI Chatbot Widget mounted across all pages.
 */
export function FloatingScholarshipChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div
          className={cn(
            "transition-all duration-200 mb-2",
            isExpanded
              ? "w-[94vw] sm:w-[540px] md:w-[600px]"
              : "w-[92vw] sm:w-[400px] md:w-[420px]"
          )}
        >
          <div className="flex justify-end mb-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="h-6 px-2 text-[10px] gap-1 shadow-sm border"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-3 w-3" />
                  <span>Compact View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3" />
                  <span>Expand Chat</span>
                </>
              )}
            </Button>
          </div>
          <ChatAssistant mode="floating" onClose={() => setIsOpen(false)} />
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-12 px-4 rounded-2xl bg-indigo-950 hover:bg-indigo-900 text-white shadow-xl border border-amber-400/40 flex items-center gap-2.5 group"
        >
          <div className="relative p-1.5 rounded-lg bg-amber-400 text-slate-950">
            <MessageSquare className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-950" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-none flex items-center gap-1">
              <span>ScholarAI Chatbot</span>
              <Sparkles className="h-3 w-3 text-amber-300" />
            </p>
            <p className="text-[10px] text-indigo-200 mt-0.5">
              Ask in EN • हिंदी • తెలుగు
            </p>
          </div>
        </Button>
      )}
    </div>
  );
}
