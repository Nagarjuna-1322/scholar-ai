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
  ArrowRight,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Calendar,
  IndianRupee,
  Building2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { daysUntil } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/DeadlineIndicator";
import { generateScholarshipSummaryPdf } from "@/lib/pdfGenerator";
import { useProfile } from "@/contexts/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import type { Scholarship } from "@/lib/data";

export function ScholarshipUpdateModal() {
  const {
    scholarships,
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

  // New scholarship form state
  const [newTitle, setNewTitle] = useState("");
  const [newProvider, setNewProvider] = useState("");
  const [newCategory, setNewCategory] = useState<"Government" | "Private">("Government");
  const [newAmount, setNewAmount] = useState("₹50,000 / year");
  const [newDeadline, setNewDeadline] = useState("2026-12-31");
  const [newIncomeLimit, setNewIncomeLimit] = useState(600000);
  const [newCourses, setNewCourses] = useState("Bachelors, Engineering, Medical");
  const [newApplyLink, setNewApplyLink] = useState("https://scholarships.gov.in/");
  const [newDescription, setNewDescription] = useState("");

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      checkForUpdates(true);
      setIsSyncing(false);
    }, 600);
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

    publishScholarship({
      title: newTitle.trim(),
      provider: newProvider.trim(),
      category: newCategory,
      amount: newAmount.trim() || "₹40,000 / year",
      deadline: newDeadline || "2026-12-31",
      income_limit: Number(newIncomeLimit) || 500000,
      eligible_courses: eligibleCoursesArray.length > 0 ? eligibleCoursesArray : ["Bachelors", "Engineering"],
      apply_link: newApplyLink.trim() || "https://scholarships.gov.in/",
      description:
        newDescription.trim() ||
        `Newly published scholarship program by ${newProvider} offering ${newAmount} financial assistance to eligible students.`,
      tags: [newCategory.toLowerCase(), "new", "merit"],
      source_portal: `${newProvider} Official Portal`,
    });

    // Reset form and navigate to newly published tab
    setNewTitle("");
    setNewProvider("");
    setNewDescription("");
    setActiveTab("newly-published");
  };

  return (
    <Dialog open={isUpdateModalOpen} onOpenChange={setUpdateModalOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b bg-gradient-to-r from-emerald-50/70 via-background to-indigo-50/50 dark:from-emerald-950/20 dark:to-indigo-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </span>
                <DialogTitle className="text-xl font-bold font-headline">
                  Scholarship Updates & Lifecycle Center
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 text-xs text-muted-foreground">
                Automatic lifecycle management: removes past deadlines, publishes fresh cycles, and notifies you of new grants.
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="gap-2 shrink-0 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Scan & Check Now"}</span>
            </Button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            <div className="p-2.5 rounded-lg border bg-background/80 flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">Active Schemes</span>
              <span className="text-lg font-bold text-foreground">{stats.totalActive}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Newly Published</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {stats.newlyPublishedCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Expired Replaced</span>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                {stats.expiredReplacedCount}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border bg-background/80 flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground">Last Checked</span>
              <span className="text-xs font-semibold text-foreground mt-1">
                {lastCheckedTime || "Today, Live"}
              </span>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-5">
              <TabsTrigger value="newly-published" className="gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Newly Published ({newlyPublished.length})</span>
              </TabsTrigger>
              <TabsTrigger value="expired-archive" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>Expired & Replaced ({expiredArchive.length})</span>
              </TabsTrigger>
              <TabsTrigger value="publish-new" className="gap-1.5 text-xs">
                <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
                <span>Publish New Scheme</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Newly Published Scholarships */}
            <TabsContent value="newly-published" className="space-y-3.5 m-0">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Live & Verified Applications:</span> These schemes are active, recently announced, and accepting applications for the 2026-27 academic session.
                </div>
              </div>

              {newlyPublished.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-sm font-medium">All active scholarships are up to date.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click &quot;Scan & Check Now&quot; to check for new published programs.
                  </p>
                </div>
              ) : (
                newlyPublished.map((s) => {
                  const daysLeft = daysUntil(s.deadline);
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-card hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pl-1">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                              {s.title}
                            </h4>
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1 animate-pulse">
                              <Sparkles className="h-3 w-3" />
                              NEW
                            </Badge>
                            {s.replacesTitle && (
                              <Badge
                                variant="outline"
                                className="text-[10px] border-indigo-200 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30"
                              >
                                Replaces Expired Cycle
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {s.provider}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {s.amount}
                            </span>
                            {s.publishedAt && (
                              <>
                                <span>•</span>
                                <span className="text-[11px] text-muted-foreground">
                                  Published: {s.publishedAt}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <DeadlineIndicator deadline={s.deadline} variant="compact" />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground pl-1 line-clamp-2">
                        {s.description}
                      </p>

                      {s.replacesTitle && (
                        <div className="pl-1 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/70 dark:border-amber-900/40">
                          <strong>Replacement Notice:</strong> This scholarship replaced the expired program &quot;{s.replacesTitle}&quot; so your opportunities remain uninterrupted.
                        </div>
                      )}

                      <div className="pt-2 border-t flex items-center justify-between gap-2 pl-1 flex-wrap">
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
                            className="h-8 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Summary PDF</span>
                          </Button>
                          <Button asChild size="sm" className="h-8 text-xs gap-1">
                            <a href={s.apply_link} target="_blank" rel="noopener noreferrer">
                              <span>Apply Now</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Tab 2: Expired & Replaced Archive */}
            <TabsContent value="expired-archive" className="space-y-3.5 m-0">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Automatic Deadlines Purge:</span> When a scholarship application deadline passes, the system automatically removes it from active student listings and substitutes it with active replacement opportunities.
                </div>
              </div>

              {expiredArchive.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No expired scholarships on record.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All listed scholarships currently have open application windows.
                  </p>
                </div>
              ) : (
                expiredArchive.map((exp, idx) => (
                  <div
                    key={`${exp.expiredId}-${idx}`}
                    className="p-4 rounded-xl border border-border bg-card/60 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-foreground line-through opacity-75">
                            {exp.expiredTitle}
                          </h4>
                          <Badge variant="destructive" className="text-[10px] uppercase">
                            Expired on {exp.originalDeadline}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Organized by {exp.provider} • Retired from active student directory on {exp.retiredOn}
                        </p>
                      </div>
                    </div>

                    {exp.replacementTitle ? (
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg flex items-center gap-3">
                        <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="text-xs">
                          <span className="text-muted-foreground">Active Successor Replacement: </span>
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            {exp.replacementTitle}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {exp.reason}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {exp.reason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* Tab 3: Publish New Scheme */}
            <TabsContent value="publish-new" className="space-y-4 m-0">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold">Publish to Directory:</span> Add a newly launched government or corporate scholarship scheme. It will be instantly featured with a &quot;NEW&quot; badge and published to all students.
              </div>

              <form onSubmit={handleCreateScholarship} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-title" className="text-xs font-semibold">Scholarship Title *</Label>
                    <Input
                      id="new-title"
                      placeholder="e.g. Infosys STEM Scholarship 2026-27"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-provider" className="text-xs font-semibold">Sponsoring Provider *</Label>
                    <Input
                      id="new-provider"
                      placeholder="e.g. Infosys Foundation or Govt of India"
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
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-amount" className="text-xs font-semibold">Grant Amount</Label>
                    <Input
                      id="new-amount"
                      placeholder="e.g. ₹60,000 / year"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-deadline" className="text-xs font-semibold">Application Deadline</Label>
                    <Input
                      id="new-deadline"
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-income" className="text-xs font-semibold">Max Family Income Limit (₹)</Label>
                    <Input
                      id="new-income"
                      type="number"
                      placeholder="e.g. 500000"
                      value={newIncomeLimit}
                      onChange={(e) => setNewIncomeLimit(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-courses" className="text-xs font-semibold">Eligible Courses (comma separated)</Label>
                    <Input
                      id="new-courses"
                      placeholder="Bachelors, Masters, Engineering, Medical"
                      value={newCourses}
                      onChange={(e) => setNewCourses(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-link" className="text-xs font-semibold">Official Application Portal URL</Label>
                  <Input
                    id="new-link"
                    type="url"
                    placeholder="https://scholarships.gov.in/"
                    value={newApplyLink}
                    onChange={(e) => setNewApplyLink(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-desc" className="text-xs font-semibold">Description & Eligibility Criteria</Label>
                  <Textarea
                    id="new-desc"
                    placeholder="Detail the scholarship benefits, selection criteria, and qualifications..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    <span>Publish & Announce Scheme</span>
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
