"use client";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { User, GraduationCap, Sparkles } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  const { setProfileOpen } = useProfile();
  const { stats, setUpdateModalOpen, hasNewAlert } = useScholarships();

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden"/>
        <div className="hidden md:flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-slate-800">
            ScholarAI
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-4">
        <Button
          onClick={() => setUpdateModalOpen(true)}
          variant="outline"
          size="sm"
          className="relative gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70"
          title="View newly published scholarships & replaced expired schemes"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span className="font-semibold text-xs">
            Updates ({stats.newlyPublishedCount} New)
          </span>
          {hasNewAlert && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </Button>

        <Button onClick={() => setProfileOpen(true)} variant="outline" size="sm">
          <User className="mr-1.5 h-3.5 w-3.5" />
          <span>Edit Profile</span>
        </Button>
      </div>
    </header>
  );
}
