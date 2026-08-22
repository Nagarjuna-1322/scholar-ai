"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
            <HistoryIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Application History</p>
            <p>This section will show your past scholarship applications and their status.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
