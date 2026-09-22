"use client";

import { useState } from "react";
import type { Scholarship } from "@/lib/data";
import { useProfile } from "@/contexts/ProfileContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { useToast } from "@/hooks/use-toast";
import { downloadApplicationSummaryPdf } from "@/lib/pdfGenerator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  IndianRupee,
  GraduationCap,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface ApplicationSummaryModalProps {
  scholarship: Scholarship | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationSummaryModal({
  scholarship,
  isOpen,
  onOpenChange,
}: ApplicationSummaryModalProps) {
  const { profile } = useProfile();
  const { getStatus } = useApplicationTracker();
  const { toast } = useToast();

  const [refNumber, setRefNumber] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!scholarship) return null;

  const currentStatus = getStatus(scholarship.id) || "Ready to Apply";
  const isIncomeEligible = profile.income <= scholarship.income_limit;

  const handleDownload = () => {
    try {
      setIsGenerating(true);
      downloadApplicationSummaryPdf({
        scholarship,
        profile,
        notes: personalNotes,
        applicationReference: refNumber,
        submissionStatus: currentStatus,
      });

      toast({
        title: "Application Summary Downloaded",
        description: `Your PDF summary for "${scholarship.title}" has been saved to your downloads folder.`,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Unable to generate the summary PDF. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    try {
      setIsGenerating(true);
      const doc = downloadApplicationSummaryPdf;
      // We can also open print via window.print or generate doc and open blob url
      downloadApplicationSummaryPdf({
        scholarship,
        profile,
        notes: personalNotes,
        applicationReference: refNumber,
        submissionStatus: currentStatus,
      });
      toast({
        title: "PDF Ready for Printing",
        description: "Your summary document has been generated and saved.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 flex flex-col">
        {/* Header with gradient accent */}
        <div className="bg-slate-900 text-white p-6 pb-5 rounded-t-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg text-white font-bold tracking-tight">
                    Scholarship Application Summary
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs">
                    Simplified PDF dossier & pre-submission checklist for your personal records
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-[11px] shrink-0">
                A4 Printable Dossier
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Target Scholarship Summary Card */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge
                  variant="secondary"
                  className={
                    scholarship.category === "Government"
                      ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/20 text-[10px] mb-1.5"
                      : "bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-600/20 text-[10px] mb-1.5"
                  }
                >
                  {scholarship.category === "Government" ? "🏛️ Central / State Scheme" : "🏢 Private / CSR Initiative"}
                </Badge>
                <h4 className="font-semibold text-base text-foreground leading-snug">{scholarship.title}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {scholarship.provider}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-primary block">{scholarship.amount}</span>
                <span className="text-[11px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  Deadline: {scholarship.deadline}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {scholarship.description}
            </p>
          </div>

          {/* User Profile Snapshot Grid */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                Applicant Record Data
              </h5>
              <Badge
                variant={isIncomeEligible ? "outline" : "destructive"}
                className={`text-[10px] ${isIncomeEligible ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : ""}`}
              >
                {isIncomeEligible ? "✓ Income Criteria Met" : "! Income Above Limit"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] block">Applicant Name</span>
                <span className="font-semibold text-foreground truncate block">
                  {profile.name || "Student Applicant"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] block">Current Course</span>
                <span className="font-semibold text-foreground truncate block">
                  {profile.course || "Bachelors"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] block">Academic Score</span>
                <span className="font-semibold text-foreground block">
                  {profile.marks_percent}%
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground text-[11px] block">Annual Income</span>
                <span className="font-semibold text-foreground block">
                  ₹{profile.income.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Included Checklist & Requirements Preview */}
          <div className="rounded-lg border bg-card p-4 space-y-2.5">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Document Verification Checklist (Embedded in PDF)
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Academic marksheets (Current & 10th/12th)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Valid Government Income Certificate</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Institute Bonafide / Enrollment Letter</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Active Savings Bank Account Passbook</span>
              </div>
            </div>
          </div>

          {/* Optional Custom Fields for the PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="pdf-ref" className="text-xs font-medium">
                Application / Token Ref (Optional)
              </Label>
              <Input
                id="pdf-ref"
                placeholder="e.g. NSP-2026-98124 or REL-7841"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pdf-notes" className="text-xs font-medium">
                Personal Record Note (Optional)
              </Label>
              <Input
                id="pdf-notes"
                placeholder="e.g. Submitted online, pending college approval"
                value={personalNotes}
                onChange={(e) => setPersonalNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-muted/40 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <a href={scholarship.apply_link} target="_blank" rel="noopener noreferrer">
                <span>Official Portal</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-sm font-semibold"
            >
              <Download className="h-4 w-4" />
              <span>Download Summary PDF</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
