"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header } from "@/components/Header";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { OfflineIndicator } from "@/components/PWAInstallButton";
import { FloatingScholarshipChatbot } from "@/components/ChatAssistant";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Bot,
  MessageSquare,
  History,
  Globe,
  User,
  FileSearch,
  Scale,
  Calculator,
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const menuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { href: "/ai-matcher", icon: Bot, label: t("nav.aiMatcher") },
    { href: "/recommendations", icon: Lightbulb, label: t("nav.recommendations") },
    { href: "/history", icon: History, label: t("nav.tracker") },
    { href: "/compare", icon: Scale, label: t("nav.compare") },
    { href: "/planner", icon: Calculator, label: t("nav.planner") },
    { href: "/websites", icon: Globe, label: "Official Portals" },
    { href: "/profile", icon: User, label: t("nav.profile") },
  ];

  const mobileBottomItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Discover" },
    { href: "/ai-matcher", icon: Bot, label: "Eligibility" },
    { href: "/recommendations", icon: Lightbulb, label: "Matches" },
    { href: "/history", icon: History, label: "Tracker" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2.5 p-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950 text-amber-400">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="text-lg font-bold font-headline text-slate-900 dark:text-white leading-none">
                ScholarAI
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Student Scholarship Finder
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-3 py-2 text-[11px] text-muted-foreground space-y-1 group-data-[collapsible=icon]:hidden border-t">
            <p className="font-medium text-foreground">Zero-Fee Guarantee</p>
            <p>Verified NSP, AICTE & State portals never charge application fees.</p>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <OfflineIndicator />
        <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-10">
          <Header />
          <ProfileForm />
          {children}
          <footer className="text-center text-xs text-muted-foreground mt-12 pt-6 border-t">
            ScholarAI — Helping Indian Students Discover & Track Verified Scholarships Easily.
          </footer>
        </main>

        {/* Global Floating AI Scholarship Chatbot */}
        <FloatingScholarshipChatbot />

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around py-1.5 px-2">
          {mobileBottomItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium ${
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
