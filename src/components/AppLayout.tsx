"use client";
import React from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { GraduationCap, LayoutDashboard, Lightbulb, Bot, History, Globe, User } from "lucide-react";

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/ai-matcher', icon: Bot, label: 'AI Matcher' },
    { href: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
    { href: '/history', icon: History, label: 'History' },
    { href: '/websites', icon: Globe, label: 'Websites' },
    { href: '/profile', icon: User, label: 'Profile' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2">
             <GraduationCap className="h-8 w-8 text-primary" />
             <h2 className="text-xl font-bold font-headline text-slate-800 dark:text-white group-data-[collapsible=icon]:hidden">
                ScholarAI
             </h2>
           </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {menuItems.map(item => (
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
            <p className="text-xs text-muted-foreground px-4 mt-4 group-data-[collapsible=icon]:hidden">
                © {new Date().getFullYear()} ScholarAI
            </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
            <Header />
            <ProfileForm />
            {children}
            <footer className="text-center text-xs text-gray-500 mt-12">
                ScholarAI Demo — Built with Next.js and Genkit AI.
            </footer>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
