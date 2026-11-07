"use client";

import React, { useState, useMemo } from "react";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { evaluateAndRankScholarships } from "@/lib/eligibilityEngine";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Info,
  Landmark,
  Building2,
} from "lucide-react";

export default function FinancialAidPlannerPage() {
  const { scholarships } = useScholarships();
  const { profile } = useProfile();
  const { getStatus } = useApplicationTracker();

  const [tuitionFee, setTuitionFee] = useState<number>(95000);
  const [hostelExpense, setHostelExpense] = useState<number>(48000);
  const [booksAndLaptop, setBooksAndLaptop] = useState<number>(18000);
  const [transportAndLiving, setTransportAndLiving] = useState<number>(15000);

  const eligibleOrPossible = useMemo(() => {
    return evaluateAndRankScholarships(profile, scholarships).filter(
      (x) => x.evaluation.status !== "Not Eligible"
    );
  }, [profile, scholarships]);

  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(() =>
    scholarships.slice(0, 2).map((s) => String(s.id))
  );

  const togglePlanScholarship = (id: string | number) => {
    const key = String(id);
    setSelectedPlanIds((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const totalAnnualCost =
    (Number(tuitionFee) || 0) +
    (Number(hostelExpense) || 0) +
    (Number(booksAndLaptop) || 0) +
    (Number(transportAndLiving) || 0);

  const selectedScholarships = useMemo(() => {
    return selectedPlanIds
      .map((id) => scholarships.find((s) => String(s.id) === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [selectedPlanIds, scholarships]);

  // Check Central / State Government Scholarship Combination Restrictions
  const selectedGovtScholarships = useMemo(
    () => selectedScholarships.filter((s) => s.category === "Government"),
    [selectedScholarships]
  );

  const hasGovtOverlapWarning = selectedGovtScholarships.length > 1;

  const { confirmedAwardTotal, estimatedPendingTotal } = useMemo(() => {
    let confirmed = 0;
    let estimated = 0;
    for (const s of selectedScholarships) {
      const status = getStatus(s.id);
      if (status === "Awarded") {
        confirmed += s.amount;
      } else {
        estimated += s.amount;
      }
    }
    return { confirmedAwardTotal: confirmed, estimatedPendingTotal: estimated };
  }, [selectedScholarships, getStatus]);

  const totalProjectedAid = confirmedAwardTotal + estimatedPendingTotal;
  const remainingCost = Math.max(0, totalAnnualCost - totalProjectedAid);
  const coveragePercentage =
    totalAnnualCost > 0 ? Math.min(100, Math.round((totalProjectedAid / totalAnnualCost) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Student Financial Aid & Tuition Coverage Planner
          </h1>
          <Badge variant="outline" className="text-xs">
            Estimates vs Confirmed Awards
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter your annual tuition and living costs, select scholarships you plan to apply for, and verify Central NSP / State Post-Matric combination rules.
        </p>
      </div>

      {/* NSP / State Combination Rule Warning */}
      {hasGovtOverlapWarning && (
        <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50/80 dark:bg-amber-950/30 flex items-start gap-3 text-xs">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950 dark:text-amber-200">
              Government Scholarship Combination Rule Warning ({selectedGovtScholarships.length} Government Schemes Selected)
            </p>
            <p className="text-amber-900 dark:text-amber-300 leading-relaxed">
              Under <strong>National Scholarship Portal (NSP)</strong>, <strong>AICTE</strong>, and <strong>State Post-Matric (ePASS / MahaDBT / SSP)</strong> rules, a student cannot simultaneously hold two Central/State government tuition scholarships in the same academic year. However, you CAN typically combine <strong>1 Government Scholarship</strong> with <strong>Private / Corporate CSR Scholarships</strong> (such as Reliance Foundation, Tata Capital, or HDFC Parivartan), subject to institutional approval.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Annual Education Expense Inputs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold">1. Annual Education Expenses</CardTitle>
            <CardDescription className="text-xs">
              Enter your academic year fee structure in INR (₹)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label>Annual College Tuition Fee (₹)</Label>
              <Input
                type="number"
                min={0}
                value={tuitionFee}
                onChange={(e) => setTuitionFee(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hostel / Mess / Accommodation (₹)</Label>
              <Input
                type="number"
                min={0}
                value={hostelExpense}
                onChange={(e) => setHostelExpense(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Books, Lab Materials & Laptop (₹)</Label>
              <Input
                type="number"
                min={0}
                value={booksAndLaptop}
                onChange={(e) => setBooksAndLaptop(Number(e.target.value))}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Transport & Exam Fees (₹)</Label>
              <Input
                type="number"
                min={0}
                value={transportAndLiving}
                onChange={(e) => setTransportAndLiving(Number(e.target.value))}
                className="font-mono"
              />
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-sm font-bold">
              <span>Total Annual Cost:</span>
              <span className="font-mono text-base">
                ₹{totalAnnualCost.toLocaleString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Right 2 Columns: Coverage Summary & Scholarship Selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              2. Estimated vs Confirmed Scholarship Coverage Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Clearly distinguishes scholarships already marked &ldquo;Awarded&rdquo; from estimated pending applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border bg-emerald-50/60 dark:bg-emerald-950/20">
                <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                  Confirmed Awarded Aid
                </span>
                <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹{confirmedAwardTotal.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-muted-foreground">Status: Awarded</span>
              </div>

              <div className="p-3.5 rounded-xl border bg-indigo-50/60 dark:bg-indigo-950/20">
                <span className="text-[11px] font-medium text-indigo-800 dark:text-indigo-300">
                  Estimated / Planned Aid
                </span>
                <p className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-1">
                  ₹{estimatedPendingTotal.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-muted-foreground">Subject to selection</span>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Remaining Out-of-Pocket
                </span>
                <p className="text-xl font-bold font-mono text-foreground mt-1">
                  ₹{remainingCost.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {coveragePercentage}% of ₹{totalAnnualCost.toLocaleString("en-IN")} covered
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium">Projected Financial Aid Coverage</span>
                <span className="font-mono font-bold">{coveragePercentage}%</span>
              </div>
              <Progress value={coveragePercentage} className="h-2.5" />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>
                  Note: Planned scholarship amounts are estimates based on official grant ceilings and are not guaranteed until sanctioned by the provider.
                </span>
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t">
              <p className="text-xs font-semibold">
                Select Eligible Scholarships to Include in Your Financial Plan:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {eligibleOrPossible.map(({ scholarship: s, evaluation }) => {
                  const isSelected = selectedPlanIds.includes(String(s.id));
                  const status = getStatus(s.id);
                  const isGovt = s.category === "Government";

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => togglePlanScholarship(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {isGovt ? (
                              <Landmark className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            )}
                            <span className="text-xs font-bold truncate">{s.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {s.provider} • {evaluation.status} ({evaluation.compatibilityScore}%)
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs shrink-0">
                          ₹{s.amount.toLocaleString("en-IN")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between w-full text-[10px] pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">
                          {isGovt ? "Central/State Govt (Max 1)" : "Corporate CSR (Combinable)"}
                        </span>
                        <span className="font-semibold text-primary flex items-center gap-1">
                          {status === "Awarded" ? "Confirmed Award" : isSelected ? "✓ In Plan" : "+ Add to Plan"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
