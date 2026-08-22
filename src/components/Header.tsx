"use client";

import { Button } from "@/components/ui/button";
import { useProfile } from "@/contexts/ProfileContext";
import { User, GraduationCap } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  const { setProfileOpen } = useProfile();

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
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-sm text-muted-foreground">AI-Powered Scholarship Finder</span>
        <Button onClick={() => setProfileOpen(true)} variant="outline">
          <User className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>
    </header>
  );
}
