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

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

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
