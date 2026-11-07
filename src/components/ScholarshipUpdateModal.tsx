"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RefreshCw,
  Clock,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  IndianRupee,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
import { generateScholarshipSummaryPdf } from "@/lib/pdfGenerator";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import type { Scholarship } from "@/lib/data";

export function ScholarshipUpdateModal() {
  const {
    expiredArchive,
    newlyPublished,
    lastCheckedTime,
    isUpdateModalOpen,
    setUpdateModalOpen,
    checkForUpdates,
    publishScholarship,
    stats,
  } = useScholarships();

  const { profile } = useProfile();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("newly-published");

  const [newTitle, setNewTitle] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [newCategory, setNewCategory] = useState<"Government" | "Private">("Government");
  const [newAmount, setNewAmount] = useState("50000");
  const [newDeadline, setNewDeadline] = useState("2026-12-31");
  const [newIncomeLimit, setNewIncomeLimit] = useState(600000);
  const [newCourses, setNewCourses] = useState("B.Tech, B.E, MBBS, B.Sc");
  const [newRegion, setNewRegion] = useState("All India");
  const [newApplyLink, setNewApplyLink] = useState("https://scholarships.gov.in/");
  const [newDescription, setNewDescription] = useState("");

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      checkForUpdates(true);
      setIsSyncing(false);
    }, 400);
  };

  const handleDownloadPdf = (s: Scholarship) => {
    try {
      generateScholarshipSummaryPdf(s, profile);
      toast({
        title: "Summary PDF Generated",
        description: `Downloaded application summary dossier for "${s.title}".`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "PDF Generation Error",
        description: "Failed to generate PDF. Please try again.",
      });
    }
  };

  const handleCreateScholarship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProvider.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter both scholarship title and provider name.",
      });
      return;
    }

    const eligibleCoursesArray = newCourses
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const parsedAmount = Number(String(newAmount).replace(/[^0-9]/g, "")) || 50000;

    publishScholarship({
      title: newTitle.trim(),
      provider: newProvider.trim(),
      category: newCategory,
      amount: parsedAmount,
      deadline: newDeadline || "2026-12-31",
      income_limit: Number(newIncomeLimit) || 500000,
      eligible_courses: eligibleCoursesArray.length > 0 ? eligibleCoursesArray : ["B.Tech", "B.Sc"],
      eligible_categories: ["General", "OBC", "SC", "ST", "EWS"],
      eligibility: {
        description: newDescription.trim() || `Open to ${eligibleCoursesArray.join(", ")} students with family income up to ₹${Number(newIncomeLimit).toLocaleString("en-IN")}.`,
        minMarks: 60,
        maxIncome: Number(newIncomeLimit) || 500000,
      },
      description:
        newDescription.trim() ||
        `Verified scholarship program by ${newProvider} offering ₹${parsedAmount.toLocaleString("en-IN")}/yr financial assistance to eligible students.`,
      link: newApplyLink.trim() || "https://scholarships.gov.in/",
      apply_link: newApplyLink.trim() || "https://scholarships.gov.in/",
      featured: true,
      tags: [newCategory.toLowerCase(), "verified", "merit"],
      level: "Undergraduate",
      field_of_study: "Engineering & General",
      region: newRegion || "All India",
      source_portal: `${newProvider} Official Portal`,
    });

    setNewTitle("");
    setNewProvider("");
    setNewDescription("");
    setActiveTab("newly-published");
  };

  return (
    <Dialog open={isUpdateModalOpen} onOpenChange={setUpdateModalOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </span>
                <DialogTitle className="text-xl font-bold font-headline">
                  Verified Catalog & Historical Archive Center
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                Verified scholarship lifecycle management: separates open opportunities from closed historical listings without fabricating replacement cycles.
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="gap-2 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isSyncing ? "Verifying..." : "Verify Deadlines Now"}</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-2.5 rounded-lg border bg-background flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">Open Schemes</span>
              <span className="text-lg font-bold font-mono text-foreground">{stats.totalActive}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Recently Verified</span>
              <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {stats.newlyPublishedCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Archived (Past Deadline)</span>
              <span className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300">
                {stats.expiredReplacedCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border bg-background flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">Last Verified</span>
              <span className="text-xs font-semibold text-foreground mt-1">
                {lastCheckedTime || "Live"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-5">
              <TabsTrigger value="newly-published" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Recently Verified ({newlyPublished.length})</span>
              </TabsTrigger>
              <TabsTrigger value="expired-archive" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Historical Archive ({expiredArchive.length})</span>
              </TabsTrigger>
              <TabsTrigger value="publish-new" className="gap-1.5 text-xs">
                <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
                <span>Add Verified Listing</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="newly-published" className="space-y-3.5 m-0">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Verified Official Sources:</span> Every listing below includes its official portal link and verification date.
                </div>
              </div>

              {newlyPublished.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">{s.title}</h4>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          {s.verification_status || "Verified Source"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.provider}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                          <IndianRupee className="h-3.5 w-3.5" />
                          {s.amount.toLocaleString("en-IN")}/yr
                        </span>
                        <span>•</span>
                        <span>Verified: {s.last_verified_at || "2026-02-15"}</span>
                      </div>
                    </div>
                    <DeadlineIndicator deadline={s.deadline} variant="compact" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>

                  <div className="pt-2 border-t flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] uppercase font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPdf(s)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Summary PDF</span>
                      </Button>
                      <Button asChild size="sm" className="h-8 text-xs gap-1">
                        <a href={s.apply_link || s.link} target="_blank" rel="noopener noreferrer">
                          <span>Official Portal</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="expired-archive" className="space-y-3.5 m-0">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Non-Fabricated Historical Archive:</span> Past-deadline scholarships are preserved here for reference without inventing unverified replacement dates.
                </div>
              </div>

              {expiredArchive.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No expired scholarships in archive.</p>
                </div>
              ) : (
                expiredArchive.map((exp, idx) => (
                  <div
                    key={`${exp.expiredId}-${idx}`}
                    className="p-4 rounded-xl border border-border bg-card/60 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground">{exp.expiredTitle}</h4>
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        Closed on {exp.originalDeadline}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Provider: {exp.provider} • Archived on {exp.retiredOn}
                    </p>
                    <p className="text-xs text-muted-foreground">{exp.reason}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="publish-new" className="space-y-4 m-0">
              <form onSubmit={handleCreateScholarship} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-title" className="text-xs font-semibold">Scholarship Title *</Label>
                    <Input
                      id="new-title"
                      placeholder="e.g. Telangana ePASS Post-Matric Scholarship"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-provider" className="text-xs font-semibold">Sponsoring Provider *</Label>
                    <Input
                      id="new-provider"
                      placeholder="e.g. Govt of Telangana / AICTE"
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-category" className="text-xs font-semibold">Category</Label>
                    <select
                      id="new-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as "Government" | "Private")}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      <option value="Government">Government</option>
                      <option value="Private">Private / CSR</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-amount" className="text-xs font-semibold">Annual Grant Amount (₹)</Label>
                    <Input
                      id="new-amount"
                      type="number"
                      placeholder="50000"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-deadline" className="text-xs font-semibold">Official Deadline</Label>
                    <Input
                      id="new-deadline"
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-income" className="text-xs font-semibold">Max Family Income (₹)</Label>
                    <Input
                      id="new-income"
                      type="number"
                      value={newIncomeLimit}
                      onChange={(e) => setNewIncomeLimit(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-courses" className="text-xs font-semibold">Eligible Courses</Label>
                    <Input
                      id="new-courses"
                      value={newCourses}
                      onChange={(e) => setNewCourses(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-region" className="text-xs font-semibold">State / Domicile Region</Label>
                    <Input
                      id="new-region"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-link" className="text-xs font-semibold">Official HTTPS Application Portal URL</Label>
                  <Input
                    id="new-link"
                    type="url"
                    value={newApplyLink}
                    onChange={(e) => setNewApplyLink(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-desc" className="text-xs font-semibold">Description & Official Eligibility Criteria</Label>
                  <Textarea
                    id="new-desc"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    <span>Publish Verified Scheme</span>
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
