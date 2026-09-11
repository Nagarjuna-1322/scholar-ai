"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { ScholarshipChart } from "@/components/ScholarshipChart";
import { yearlyApplicationStats, topProviders } from "@/lib/data";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { Send, CalendarCheck, Trophy, ArrowRight, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { applications } = useApplicationTracker();

  const appStats = {
    applied: Object.values(applications).filter((a) => a.status === "Applied").length,
    interviewing: Object.values(applications).filter((a) => a.status === "Interviewing").length,
    awarded: Object.values(applications).filter((a) => a.status === "Awarded").length,
    total: Object.keys(applications).length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/history">
          <Button variant="outline" size="sm" className="gap-1.5">
            <HistoryIcon className="h-4 w-4 text-primary" />
            <span>View Tracker Pipeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* User Application Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total In Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{appStats.total}</div>
            <p className="text-[11px] text-muted-foreground">Tracked applications</p>
          </CardContent>
        </Card>
        <Card className="border-blue-100 dark:border-blue-900/50">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-blue-600 dark:text-blue-400">Applied</CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{appStats.applied}</div>
            <p className="text-[11px] text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100 dark:border-amber-900/50">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400">Interviewing</CardTitle>
            <CalendarCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{appStats.interviewing}</div>
            <p className="text-[11px] text-muted-foreground">Under consideration</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 dark:border-emerald-900/50">
          <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Awarded</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{appStats.awarded}</div>
            <p className="text-[11px] text-muted-foreground">Successfully won</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scholarship Application Analysis</CardTitle>
          <CardDescription>
            Number of applications per year, broken down by provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScholarshipChart data={yearlyApplicationStats} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Scholarship Providers</CardTitle>
          <CardDescription>Companies that awarded the highest scholarship amounts this year.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {topProviders.map((provider) => (
            <div key={provider.name} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>{provider.initial}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">Total Awarded: {provider.amount}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
