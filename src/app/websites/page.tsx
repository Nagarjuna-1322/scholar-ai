"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

const websites = [
    { name: "National Scholarship Portal", url: "https://scholarships.gov.in/" },
    { name: "Buddy4Study", url: "https://www.buddy4study.com/"},
    { name: "WeMakeScholars", url: "https://www.wemakescholars.com/"},
    { name: "Leverage Edu", url: "https://leverageedu.com/scholarships/"},
]

export default function WebsitesPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Helpful Websites</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe />
            <span>Scholarship Portals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
          {websites.map(site => (
            <a href={site.url} key={site.name} target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:shadow-md hover:border-primary transition-all">
                <p className="font-semibold">{site.name}</p>
                <p className="text-sm text-primary truncate">{site.url}</p>
            </a>
          ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
