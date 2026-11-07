"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  GraduationCap,
  Sparkles,
  Scale,
  Bell,
  ShieldCheck,
  LogIn,
  LogOut,
  Globe2,
} from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { ScholarshipSearchBar } from "@/components/ScholarshipSearchBar";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export function Header() {
  const { setProfileOpen, completionPercentage } = useProfile();
  const { stats, setUpdateModalOpen, hasNewAlert, comparisonIds } = useScholarships();
  const { reminders } = useApplicationTracker();
  const {
    user,
    signInWithEmail,
    registerWithEmail,
    signInWithGoogleStructure,
    resetPassword,
    signOut,
  } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "reset">("login");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState(user?.email || "mmnagarjunareddy@gmail.com");
  const [passwordInput, setPasswordInput] = useState("");
  const [migrateLocal, setMigrateLocal] = useState(true);

  const activeRemindersCount = reminders.filter((r) => r.active).length;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "login") {
      const res = await signInWithEmail(emailInput, passwordInput, migrateLocal);
      if (res.ok) {
        setAuthDialogOpen(false);
        toast({ title: "Signed In", description: `Welcome back, ${emailInput}` });
      } else {
        toast({ variant: "destructive", title: "Sign In Failed", description: res.error });
      }
    } else if (authMode === "register") {
      const res = await registerWithEmail(nameInput, emailInput, passwordInput, migrateLocal);
      if (res.ok) {
        setAuthDialogOpen(false);
        toast({ title: "Account Created", description: `Signed in as ${emailInput}` });
      } else {
        toast({ variant: "destructive", title: "Registration Failed", description: res.error });
      }
    } else {
      const res = await resetPassword(emailInput, passwordInput);
      toast({ title: "Password Reset", description: res.message });
      setAuthMode("login");
    }
  };

  const handleGoogleSignIn = async () => {
    const res = await signInWithGoogleStructure(emailInput || "mmnagarjunareddy@gmail.com", migrateLocal);
    setAuthDialogOpen(false);
    toast({
      title: "Session Authenticated",
      description: res.notice,
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl border border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 shadow-2xs">
        {/* 1. Brand Logo & Mobile Trigger */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger className="md:hidden h-9 w-9" />
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-lg bg-indigo-950 text-amber-400 flex items-center justify-center shadow-2xs group-hover:bg-indigo-900 transition-colors">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg sm:text-xl font-bold font-headline text-slate-900 dark:text-slate-100 tracking-tight">
                  ScholarAI
                </h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">
                  Verified Student Scholarships
                </p>
              </div>
            </Link>
          </div>

          {/* Mobile Language Switcher */}
          <div className="flex md:hidden items-center gap-1 border rounded-lg p-0.5 bg-muted/50">
            {(["en", "hi", "te"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {lang === "en" ? "EN" : lang === "hi" ? "हिं" : "తె"}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Center Search Bar + Edit Profile Side-by-Side */}
        <div className="flex items-center gap-2 flex-1 max-w-2xl">
          <div className="flex-1 min-w-[180px]">
            <ScholarshipSearchBar />
          </div>

          <Button
            onClick={() => setProfileOpen(true)}
            variant="outline"
            size="sm"
            className="h-9 px-3 shrink-0 gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground font-semibold text-xs rounded-lg"
          >
            <User className="h-3.5 w-3.5 text-primary" />
            <span>Edit Profile</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono bg-background">
              {completionPercentage}%
            </Badge>
          </Button>
        </div>

        {/* 3. Right Ordered Action Group: Compare, Alerts, Language & User Account */}
        <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Compare & Reminders Group */}
          <div className="flex items-center gap-1.5">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1.5 rounded-lg"
              title="Compare scholarships side by side"
            >
              <Link href="/compare">
                <Scale className="h-3.5 w-3.5 text-indigo-600" />
                <span className="hidden xl:inline font-medium">Compare</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                  {comparisonIds.length}/4
                </Badge>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1.5 rounded-lg"
              title="View deadline reminders & tracked applications"
            >
              <Link href="/history">
                <Bell className="h-3.5 w-3.5 text-amber-600" />
                <span className="font-mono text-[11px] font-semibold">{activeRemindersCount}</span>
              </Link>
            </Button>

            <Button
              onClick={() => setUpdateModalOpen(true)}
              variant="outline"
              size="sm"
              className="relative hidden 2xl:inline-flex h-9 px-2.5 gap-1.5 rounded-lg border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70"
              title="View verified catalog status"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-semibold text-xs">
                Verified ({stats.totalActive})
              </span>
              {hasNewAlert && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </Button>
          </div>

          {/* Desktop Language Selector */}
          <div className="hidden md:flex items-center h-9 gap-0.5 border rounded-lg p-1 bg-muted/40">
            <Globe2 className="h-3.5 w-3.5 text-muted-foreground mx-1" />
            {(["en", "hi", "te"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  language === lang
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "en" ? "EN" : lang === "hi" ? "हिं" : "తె"}
              </button>
            ))}
          </div>

          <PWAInstallButton />

          {/* User Account Pill */}
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAuthDialogOpen(true)}
              className="h-9 text-xs gap-1.5 px-3 rounded-lg border-border bg-muted/30 hover:bg-muted/70"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-[110px] truncate font-semibold">{user.name}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthDialogOpen(true)}
              className="h-9 text-xs gap-1.5 px-3 rounded-lg"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Button>
          )}
        </div>
      </header>

      {/* Authentication & Session Management Modal */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-lg">
              {user ? "Your ScholarAI Account" : "Sign In to ScholarAI"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Save your profile, track your scholarship applications, and get deadline reminders across devices.
            </DialogDescription>
          </DialogHeader>

          {user ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border bg-muted/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{user.name}</span>
                  <Badge variant="outline" className="uppercase text-[10px]">
                    Student
                  </Badge>
                </div>
                <p className="text-muted-foreground font-mono">{user.email}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button asChild variant="outline" size="sm" onClick={() => setAuthDialogOpen(false)}>
                  <Link href="/profile">Manage Profile & Data</Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    signOut();
                    setAuthDialogOpen(false);
                  }}
                  className="gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              <div className="flex gap-1.5 border-b pb-2">
                {(["login", "register", "reset"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setAuthMode(m)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold capitalize ${
                      authMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {m === "login" ? "Sign In" : m === "register" ? "Create Account" : "Reset Password"}
                  </button>
                ))}
              </div>

              {authMode === "register" && (
                <div className="space-y-1">
                  <label className="font-medium">Full Name</label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="h-8 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium">Email Address</label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium">
                  {authMode === "reset" ? "New Password" : "Password"}
                </label>
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-8 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={migrateLocal}
                  onChange={(e) => setMigrateLocal(e.target.checked)}
                />
                <span>Consent to migrate existing local browser profile & saved scholarships to this account</span>
              </label>

              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" size="sm" className="w-full">
                  {authMode === "login"
                    ? "Sign In with Email"
                    : authMode === "register"
                    ? "Create Student Account"
                    : "Update Password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleSignIn}
                  className="w-full"
                >
                  Continue with Google Account Structure
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
