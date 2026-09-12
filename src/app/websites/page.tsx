"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Landmark, Building2, ShieldCheck } from "lucide-react";

const governmentPortals = [
  {
    name: "National Scholarship Portal (NSP)",
    org: "Ministry of Electronics and Information Technology (MeitY)",
    url: "https://scholarships.gov.in/",
    description: "The official national portal hosting Central Sector Schemes, Minority Affairs, AICTE, and State Welfare scholarships.",
    tag: "Central Portal",
  },
  {
    name: "AICTE Student Development Schemes",
    org: "All India Council for Technical Education",
    url: "https://www.aicte-india.org/schemes/students-development-schemes",
    description: "Official portal for Pragati (Girls in Technical), Saksham (Specially Abled), and Swanath schemes.",
    tag: "Technical & Engg",
  },
  {
    name: "DST INSPIRE Portal",
    org: "Department of Science & Technology, Govt of India",
    url: "https://online-inspire.gov.in/",
    description: "Fellowships and SHE (Scholarship for Higher Education) for top 1% science & research students.",
    tag: "Science & Research",
  },
  {
    name: "UGC e-SARTHI & National Portals",
    org: "University Grants Commission",
    url: "https://scholarships.gov.in/",
    description: "Ishan Uday special scholarship for North Eastern students, PG Indira Gandhi single girl child scholarship.",
    tag: "Higher Education",
  },
  {
    name: "MahaDBT Scholarship Portal",
    org: "Government of Maharashtra",
    url: "https://mahadbt.maharashtra.gov.in/",
    description: "Post-matric and technical education schemes for students studying in Maharashtra.",
    tag: "State Portal",
  },
  {
    name: "Karnataka State Scholarship Portal (SSP)",
    org: "Government of Karnataka",
    url: "https://ssp.postmatric.karnataka.gov.in/",
    description: "Post-matric scholarship portal for Karnataka e-attestation and direct DBT transfers.",
    tag: "State Portal",
  },
];

const privatePortals = [
  {
    name: "Reliance Foundation Scholarships",
    org: "Reliance Foundation",
    url: "https://www.reliancefoundation.org/scholarships",
    description: "5,000 undergraduate (₹2 Lakhs) and 100 postgraduate (₹6 Lakhs) scholarships for students across India.",
    tag: "Corporate CSR",
  },
  {
    name: "Buddy4Study Official Platform",
    org: "Buddy4Study India",
    url: "https://www.buddy4study.com/",
    description: "India's largest corporate CSR gateway hosting Tata Capital, HDFC Bank Parivartan, Kotak Kanya, and Birla grants.",
    tag: "Aggregator / Host",
  },
  {
    name: "Google Build Your Future",
    org: "Google / Alphabet",
    url: "https://buildyourfuture.withgoogle.com/scholarships",
    description: "Generation Google Scholarship APAC and student tech advancement grants.",
    tag: "Tech Foundation",
  },
  {
    name: "Amazon Future Engineer India",
    org: "Amazon India",
    url: "https://www.amazonfutureengineer.in/scholarship",
    description: "Four-year financial grants of ₹50,000/yr and tech mentorship for female computer science students.",
    tag: "Tech & Women",
  },
  {
    name: "Adobe University Programs (India)",
    org: "Adobe Systems",
    url: "https://www.adobe.com/careers/university/india-women-in-technology.html",
    description: "Women-in-Technology scholarship offering complete tuition waiver and summer software engineering internships.",
    tag: "Tech & Merit",
  },
  {
    name: "ONGC Scholar Portal",
    org: "ONGC Foundation",
    url: "https://ongcscholar.org/",
    description: "Dedicated portal for first-year Engineering, MBBS, MBA, and Geology scholarships for disadvantaged students.",
    tag: "Public Sector CSR",
  },
];

export default function WebsitesPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30">
            🇮🇳 Verified Portals
          </Badge>
          <Badge variant="secondary" className="text-xs">
            100% Direct Application Links
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Official Indian Scholarship Portals</h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Access verified government and private corporate scholarship registration websites in India. Apply directly on their official domains.
        </p>
      </div>

      {/* Government Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold">Government of India Central & State Portals</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {governmentPortals.map((site) => (
            <Card key={site.name} className="flex flex-col justify-between hover:shadow-md hover:border-emerald-500/50 transition-all">
              <CardHeader className="p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="default" className="bg-emerald-600 text-white hover:bg-emerald-700 text-[10px]">
                    🏛️ {site.tag}
                  </Badge>
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <CardTitle className="text-base font-bold">{site.name}</CardTitle>
                <CardDescription className="text-xs font-medium text-foreground/80">
                  {site.org}
                </CardDescription>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {site.description}
                </p>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Visit Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Corporate Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold">Corporate CSR & Private Foundation Portals</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {privatePortals.map((site) => (
            <Card key={site.name} className="flex flex-col justify-between hover:shadow-md hover:border-blue-500/50 transition-all">
              <CardHeader className="p-5 pb-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 text-[10px]">
                    🏢 {site.tag}
                  </Badge>
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle className="text-base font-bold">{site.name}</CardTitle>
                <CardDescription className="text-xs font-medium text-foreground/80">
                  {site.org}
                </CardDescription>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {site.description}
                </p>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Visit Company Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
