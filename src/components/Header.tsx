"use client";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { User, GraduationCap, Sparkles } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { ScholarshipSearchBar } from "@/components/ScholarshipSearchBar";

export function Header() {
  const { setProfileOpen } = useProfile();
  const { stats, setUpdateModalOpen, hasNewAlert } = useScholarships();

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 mb-8">
      <div className="flex items-center gap-3 shrink-0">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-slate-800 dark:text-slate-100">
            ScholarAI
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-3xl">
        {/* Real-time search bar placed beside the edit profile button */}
        <ScholarshipSearchBar />

        {/* Updates center button */}
        <Button
          onClick={() => setUpdateModalOpen(true)}
          variant="outline"
          size="sm"
          className="relative gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 shrink-0"
          title="View newly published scholarships & replaced expired schemes"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
          <span className="font-semibold text-xs hidden sm:inline">
            Updates ({stats.newlyPublishedCount} New)
          </span>
          <span className="font-semibold text-xs sm:hidden">
            Updates ({stats.newlyPublishedCount})
          </span>
          {hasNewAlert && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          )}
        </Button>

        {/* Edit profile button */}
        <Button
          onClick={() => setProfileOpen(true)}
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
        >
          <User className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Edit Profile</span>
          <span className="sm:hidden">Profile</span>
        </Button>
      </div>
    </header>
  );
}

