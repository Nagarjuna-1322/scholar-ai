"use client";

import React, { useState, useTransition, useMemo } from "react";
import { type Scholarship } from "@/lib/data";
import { evaluateAndRankScholarships } from "@/lib/eligibilityEngine";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { searchScholarshipsAction } from "@/app/actions";
import { ScholarshipList } from "@/components/ScholarshipList";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { ApplicationSummaryModal } from "@/components/ApplicationSummaryModal";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AIMatcher } from "@/components/AIMatcher";
import { useProfile } from "@/contexts/ProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Upload,
  FileSearch,
  ShieldCheck,
  Loader2,
  CheckSquare,
  Square,
} from "lucide-react";

const MASTER_DOCUMENTS = [
  "Class 10 & Class 12 Mark Sheets",
  "Previous Academic Mark Sheet / Latest Semester GPA Card",
  "Valid Family Income Certificate (Tehsildar / MeeSeva / MahaOnline)",
  "Bonafide / Current Admission Certificate from Institution",
  "Caste / Category / EWS Certificate (if applicable)",
  "Domicile / Residence Certificate",
  "Student Bank Account Passbook Copy (NPCI / DBT Linked)",
  "College Tuition Fee Receipt / Fee Structure",
  "Disability / PwD Certificate (if applicable for Saksham)",
];

interface ExtractedData {
  fullName: string | null;
  course: string | null;
  specialization: string | null;
  education_level: string | null;
  academic_year: string | null;
  institution: string | null;
  marks_percent: number | null;
  cgpa: number | null;
  income: number | null;
  category: string | null;
  state: string | null;
  achievements: string[];
  detectedDocumentType: string;
  readinessNotes: string[];
}

export default function AIMatcherPage() {
  const { toast } = useToast();
  const { profile, updateProfile, setProfileOpen } = useProfile();
  const { scholarships: catalogScholarships } = useScholarships();

  // Document & Resume Upload state integrated into Check My Eligibility
  const [documentType, setDocumentType] = useState("Resume / CV");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  const [summaryScholarship, setSummaryScholarship] = useState<Scholarship | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  const [quickSelectedId, setQuickSelectedId] = useState<string>("");
  const [activeStatusTab, setActiveStatusTab] = useState<"All" | "Eligible" | "Possibly Eligible" | "Not Eligible">("All");

  const completedDocs = new Set(profile.completed_documents || []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Unsupported file type. Please upload a PDF, TXT, PNG, or JPEG file.");
      setSelectedFile(null);
      return;
    }

    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      setFileError("File exceeds 5MB limit. Scholarship portals require files under 5MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (file.type === "text/plain") {
      file.text().then((txt) => setPastedText(txt)).catch(() => {});
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile && !pastedText.trim()) {
      toast({
        variant: "destructive",
        title: "Document or Text Required",
        description: "Upload a PDF/Image/TXT file (≤5MB) or paste your resume/mark sheet text to check eligibility.",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      let base64Data = "";
      if (selectedFile && selectedFile.type !== "text/plain") {
        base64Data = await fileToBase64(selectedFile);
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze_document",
          fileName: selectedFile?.name || "Pasted_Resume.txt",
          mimeType: selectedFile?.type || "text/plain",
          base64Data,
          extractedText: pastedText,
          documentType,
        }),
      });

      const data = await res.json();
      if (data.ok && data.extracted) {
        setExtracted(data.extracted);
        toast({
          title: "Document Verified",
          description: "Review your extracted details and click 'Apply & Check Eligibility' to update your matches.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: data.error || "Could not parse document.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to analyze document right now.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToProfile = () => {
    if (!extracted) return;
    const patch: Record<string, unknown> = {};
    if (extracted.fullName) {
      patch.name = extracted.fullName;
      patch.fullName = extracted.fullName;
    }
    if (extracted.course) patch.course = extracted.course;
    if (extracted.specialization) patch.specialization = extracted.specialization;
    if (extracted.education_level) patch.education_level = extracted.education_level;
    if (extracted.academic_year) patch.academic_year = extracted.academic_year;
    if (extracted.institution) patch.institution = extracted.institution;
    if (extracted.marks_percent !== null && extracted.marks_percent !== undefined) {
      patch.marks_percent = Number(extracted.marks_percent);
    }
    if (extracted.cgpa !== null && extracted.cgpa !== undefined) {
      patch.cgpa = Number(extracted.cgpa);
    }
    if (extracted.income !== null && extracted.income !== undefined) {
      patch.income = Number(extracted.income);
    }
    if (extracted.category) patch.category = extracted.category;
    if (extracted.state) patch.state = extracted.state;
    if (extracted.achievements?.length) {
      patch.career_interests = extracted.achievements.slice(0, 2).join("; ");
    }

    updateProfile(patch);
    toast({
      title: "Eligibility Updated from Document",
      description: "Your scholarship matches below have been refreshed with your verified document details!",
    });
  };

  const toggleDocChecklist = (docName: string) => {
    const current = profile.completed_documents || [];
    const exists = current.includes(docName);
    const updated = exists ? current.filter((d) => d !== docName) : [...current, docName];
    updateProfile({ completed_documents: updated });
  };

  const handleSelectScholarship = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
  };

  const handleOpenSummary = (scholarship: Scholarship) => {
    setSummaryScholarship(scholarship);
    setIsSummaryModalOpen(true);
  };

  const handleSearch = (query: string) => {
    setHasSearched(true);
    startSearchTransition(async () => {
      try {
        const result = await searchScholarshipsAction(query, catalogScholarships);
        setScholarships(Array.isArray(result) ? result : []);
      } catch {
        toast({
          variant: "destructive",
          title: "Search Error",
          description: "Failed to search scholarships. Please try again.",
        });
        setScholarships([]);
      }
    });
  };

  const handleClear = () => {
    setScholarships([]);
    setHasSearched(false);
  };

  // Shared Deterministic Eligibility Engine across all catalog items
  const evaluatedAll = useMemo(() => {
    return evaluateAndRankScholarships(profile, catalogScholarships);
  }, [profile, catalogScholarships]);

  const filteredEvaluations = useMemo(() => {
    if (activeStatusTab === "All") return evaluatedAll;
    return evaluatedAll.filter((x) => x.evaluation.status === activeStatusTab);
  }, [evaluatedAll, activeStatusTab]);

  const counts = useMemo(() => {
    return {
      All: evaluatedAll.length,
      Eligible: evaluatedAll.filter((x) => x.evaluation.status === "Eligible").length,
      "Possibly Eligible": evaluatedAll.filter((x) => x.evaluation.status === "Possibly Eligible").length,
      "Not Eligible": evaluatedAll.filter((x) => x.evaluation.status === "Not Eligible").length,
    };
  }, [evaluatedAll]);

  const handleQuickSummaryGenerate = () => {
    const target = catalogScholarships.find((s) => String(s.id) === quickSelectedId);
    if (target) {
      handleOpenSummary(target);
    } else if (evaluatedAll.length > 0) {
      handleOpenSummary(evaluatedAll[0].scholarship);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
              Check My Eligibility
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Resume & Document Verification
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Upload your resume, mark sheet, or income certificate to verify your details and check which scholarships you are <strong>Eligible</strong> for.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border rounded-lg p-2.5 px-3 shadow-2xs text-xs">
          <div className="truncate max-w-[220px]">
            <p className="font-semibold text-foreground truncate">{profile.name || "Student"}</p>
            <p className="text-muted-foreground text-[11px] truncate">
              {profile.course} • {profile.marks_percent}% • ₹{((profile.income ?? 0) / 100000).toFixed(1)}L • {profile.state}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setProfileOpen(true)}
            className="text-[11px] h-7 px-2 text-primary"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* INTEGRATED UPLOAD RESUME / DOCUMENTS TO CHECK ELIGIBILITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Resume or Academic Document
            </CardTitle>
            <CardDescription className="text-xs">
              Upload your Resume, Mark Sheet, or Income Certificate (PDF, PNG, JPG, TXT ≤ 5MB) to check reliability and auto-fill your eligibility profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Document Type</Label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="Resume / CV">Student Resume / CV</option>
                  <option value="Academic Mark Sheet">Class 10 / 12 / Semester Mark Sheet</option>
                  <option value="Income Certificate">Family Income Certificate</option>
                  <option value="Category / Domicile Certificate">Caste / EWS / Domicile Certificate</option>
                  <option value="Bonafide Certificate">College Bonafide / Fee Structure</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Choose File (PDF, PNG, JPG, TXT ≤ 5MB)</Label>
                <Input
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="h-9 text-xs cursor-pointer"
                />
              </div>
            </div>

            {fileError && (
              <div className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {selectedFile && !fileError && (
              <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between">
                <span className="font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px]">Verified ≤5MB</Badge>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Or Paste Resume / Mark Sheet Details</Label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Example: Nagarjuna Reddy, B.Tech Computer Science (2nd Year) at JNTU Hyderabad, Telangana. Class 12 Marks: 91.4%, CGPA: 8.7. Annual Family Income: Rs. 1,80,000. Category: General..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handleAnalyzeDocument}
                disabled={isAnalyzing}
                className="gap-1.5 text-xs"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Verify Document & Check Eligibility</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPastedText(
                    "Nagarjuna Reddy | B.Tech in Computer Science & Engineering (2nd Year), JNTU Hyderabad, Telangana | Class 12 Percentage: 88.5% | Current CGPA: 8.6 | Annual Family Income: ₹220000 | Category: General | Achievements: Smart India Hackathon Finalist"
                  )
                }
                className="text-xs"
              >
                Try Sample Resume
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowChecklist((prev) => !prev)}
                className="text-xs ml-auto"
              >
                {showChecklist ? "Hide Document Checklist" : `Document Checklist (${completedDocs.size}/${MASTER_DOCUMENTS.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Details & Instant Eligibility Confirmation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileSearch className="h-4 w-4 text-indigo-600" />
              Verified Details from Your Document
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm or edit your extracted details below to immediately recalculate your scholarship eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {!extracted ? (
              <div className="py-10 px-4 text-center text-muted-foreground border border-dashed rounded-lg space-y-2">
                <p className="font-medium text-foreground">No document analyzed yet</p>
                <p>
                  Upload your resume, mark sheet, or certificate on the left (or click <strong>Try Sample Resume</strong>) to verify your academic and income reliability.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Course / Degree</Label>
                    <Input
                      value={extracted.course || ""}
                      onChange={(e) => setExtracted({ ...extracted, course: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Specialization</Label>
                    <Input
                      value={extracted.specialization || ""}
                      onChange={(e) => setExtracted({ ...extracted, specialization: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Marks (%)</Label>
                    <Input
                      type="number"
                      value={extracted.marks_percent ?? ""}
                      onChange={(e) =>
                        setExtracted({
                          ...extracted,
                          marks_percent: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">CGPA</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={extracted.cgpa ?? ""}
                      onChange={(e) =>
                        setExtracted({
                          ...extracted,
                          cgpa: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Annual Family Income (₹)</Label>
                    <Input
                      type="number"
                      value={extracted.income ?? ""}
                      onChange={(e) =>
                        setExtracted({
                          ...extracted,
                          income: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">State / Domicile</Label>
                    <Input
                      value={extracted.state || ""}
                      onChange={(e) => setExtracted({ ...extracted, state: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {extracted.achievements && extracted.achievements.length > 0 && (
                  <div className="p-2.5 rounded-lg border bg-muted/40 space-y-1">
                    <p className="font-semibold">Detected Achievements & Reliability Notes:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {extracted.achievements.map((ach, i) => (
                        <li key={i}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          {extracted && (
            <CardFooter className="border-t pt-3 flex justify-end">
              <Button size="sm" onClick={handleApplyToProfile} className="gap-1.5 text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Apply & Check My Eligibility Now
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Collapsible Document Readiness Checklist */}
      {showChecklist && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold">
                  Scholarship Document Readiness Checklist
                </CardTitle>
                <CardDescription className="text-xs">
                  Check off the documents you have ready. Your selections update your readiness across all {catalogScholarships.length} scholarships.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs self-start">
                {completedDocs.size} / {MASTER_DOCUMENTS.length} Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MASTER_DOCUMENTS.map((docName) => {
                const isDone = completedDocs.has(docName);
                return (
                  <button
                    key={docName}
                    type="button"
                    onClick={() => toggleDocChecklist(docName)}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs text-left transition-all ${
                      isDone
                        ? "border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "border-border hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium leading-snug">{docName}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Summary Dossier Generator Card */}
      <Card className="border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                <FileText className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                  Download Eligibility & Document Readiness PDF
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Export a 1-page printable A4 PDF with your profile snapshot, eligibility status, and mandatory document checklist.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Select
                value={quickSelectedId}
                onValueChange={(val) => {
                  setQuickSelectedId(val);
                  const target = catalogScholarships.find((s) => String(s.id) === val);
                  if (target) handleOpenSummary(target);
                }}
              >
                <SelectTrigger className="w-[210px] text-xs h-8 bg-background">
                  <SelectValue placeholder="Select scholarship..." />
                </SelectTrigger>
                <SelectContent>
                  {catalogScholarships.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)} className="text-xs">
                      {s.title.length > 30 ? `${s.title.slice(0, 30)}...` : s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleQuickSummaryGenerate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Natural Language Search Bar */}
      <div className="space-y-2">
        <AIMatcher isSearching={isSearching} onSearch={handleSearch} onClear={handleClear} />
      </div>

      {isSearching ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      ) : hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/40 p-3 px-4 rounded-lg border text-xs">
            <span>Found {scholarships.length} matching scholarships</span>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs h-7">
              Reset Search
            </Button>
          </div>
          <ScholarshipList
            scholarships={scholarships}
            onSelectScholarship={handleSelectScholarship}
            onGenerateSummary={handleOpenSummary}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Three Explicit Eligibility State Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex p-1 bg-muted rounded-lg text-xs font-medium flex-wrap gap-1">
              {(["All", "Eligible", "Possibly Eligible", "Not Eligible"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveStatusTab(tab)}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    activeStatusTab === tab
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                    {counts[tab]}
                  </Badge>
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Click any scholarship for full matched criteria, unmet criteria & required documents
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvaluations.map(({ scholarship: s, evaluation }) => (
              <Card
                key={s.id}
                className="flex flex-col justify-between hover:shadow-md transition-all border bg-card"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {evaluation.status === "Eligible" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1 font-mono">
                            <CheckCircle2 className="h-3 w-3" />
                            Eligible ({evaluation.compatibilityScore}%)
                          </Badge>
                        ) : evaluation.status === "Possibly Eligible" ? (
                          <Badge className="bg-amber-600 text-white text-[10px] gap-1 font-mono">
                            <AlertTriangle className="h-3 w-3" />
                            Possibly Eligible ({evaluation.compatibilityScore}%)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] gap-1 font-mono">
                            <XCircle className="h-3 w-3" />
                            Not Eligible ({evaluation.compatibilityScore}%)
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {s.region}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-sm leading-snug text-foreground">{s.title}</h4>
                      <p className="text-xs text-muted-foreground">{s.provider}</p>
                    </div>

                    <Badge variant="outline" className="font-mono font-semibold text-primary border-primary/40 bg-primary/5 text-xs shrink-0">
                      ₹{s.amount.toLocaleString("en-IN")}/yr
                    </Badge>
                  </div>

                  {/* Transparent Matched vs Unmet Criteria */}
                  <div className="space-y-1 pt-1 text-xs">
                    {evaluation.matchedCriteria.slice(0, 2).map((m, idx) => (
                      <p key={idx} className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{m}</span>
                      </p>
                    ))}
                    {evaluation.unmetCriteria.map((u, idx) => (
                      <p key={idx} className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <XCircle className="h-3 w-3 shrink-0" />
                        <span className="truncate">{u}</span>
                      </p>
                    ))}
                    {evaluation.missingInformation.map((mi, idx) => (
                      <p key={idx} className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span className="truncate">{mi}</span>
                      </p>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-1 pb-3">
                  <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Deadline: <strong className="text-foreground">{s.deadline}</strong>
                    </span>
                    <span>
                      {evaluation.missingDocuments.length > 0
                        ? `${evaluation.missingDocuments.length} docs to prepare`
                        : "All docs ready"}
                    </span>
                  </div>
                </CardContent>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectScholarship(s)}
                    className="text-xs h-8 px-2.5"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Full Breakdown & Apply
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenSummary(s)}
                    className="text-xs h-8 px-2.5 gap-1.5"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Summary PDF</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />

      <ApplicationSummaryModal
        scholarship={summaryScholarship}
        isOpen={isSummaryModalOpen}
        onOpenChange={setIsSummaryModalOpen}
      />
    </div>
  );
}
