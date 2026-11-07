"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useProfile } from "@/contexts/ProfileContext";
import { evaluateScholarshipEligibility } from "@/lib/eligibilityEngine";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scale,
  X,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from "lucide-react";

export default function ComparePage() {
  const {
    scholarships,
    comparisonIds,
    toggleCompareScholarship,
    clearComparison,
  } = useScholarships();
  const { profile } = useProfile();

  const selectedScholarships = useMemo(() => {
    return comparisonIds
      .map((id) => scholarships.find((s) => String(s.id) === String(id)))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [comparisonIds, scholarships]);

  const quickAddPool = useMemo(() => {
    return scholarships
      .filter((s) => !comparisonIds.includes(String(s.id)))
      .slice(0, 8);
  }, [scholarships, comparisonIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Side-by-Side Scholarship Comparison (Up to 4)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Compare funding amounts, deterministic compatibility, income limits, academic requirements, deadlines, required documents, and combinability rules.
          </p>
        </div>
        {selectedScholarships.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearComparison} className="text-xs self-start">
            Clear All ({selectedScholarships.length}/4)
          </Button>
        )}
      </div>

      {/* Quick Selector Strip when < 4 selected */}
      {selectedScholarships.length < 4 && (
        <Card className="bg-muted/30">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Scholarships to Compare ({selectedScholarships.length}/4 Selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex flex-wrap gap-2">
            {quickAddPool.map((s) => (
              <Button
                key={s.id}
                size="sm"
                variant="outline"
                onClick={() => toggleCompareScholarship(s.id)}
                className="h-8 text-xs gap-1.5 bg-background"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span className="max-w-[210px] truncate">{s.title}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedScholarships.length === 0 ? (
        <Card className="border-dashed py-14 text-center">
          <CardContent className="space-y-3 max-w-md mx-auto">
            <Scale className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-semibold">No scholarships selected for comparison yet</h3>
            <p className="text-xs text-muted-foreground">
              Click any scholarship button above or click the Compare icon on cards in the Dashboard to compare up to 4 scholarships across 10 key dimensions.
            </p>
            <Button asChild size="sm">
              <Link href="/dashboard">Browse Scholarship Directory</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-2xs">
          <table className="w-full text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3.5 text-left font-bold text-muted-foreground uppercase tracking-wider w-44">
                  Comparison Dimension
                </th>
                {selectedScholarships.map((s) => (
                  <th key={s.id} className="p-3.5 text-left align-top border-l w-64">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-sm text-foreground leading-snug">
                        {s.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCompareScholarship(s.id)}
                        className="text-muted-foreground hover:text-destructive p-1 shrink-0"
                        title="Remove from comparison"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* 1. Provider & Category */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  1. Provider & Type
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l">
                    <p className="font-semibold text-foreground">{s.provider}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {s.category} • {s.region}
                    </Badge>
                  </td>
                ))}
              </tr>

              {/* 2. Funding Amount */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  2. Annual Funding
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l font-mono font-bold text-sm text-primary">
                    ₹{s.amount.toLocaleString("en-IN")} / yr
                  </td>
                ))}
              </tr>

              {/* 3. Deterministic Eligibility Status */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  3. Profile Compatibility
                </td>
                {selectedScholarships.map((s) => {
                  const ev = evaluateScholarshipEligibility(profile, s);
                  return (
                    <td key={s.id} className="p-3.5 border-l space-y-1">
                      {ev.status === "Eligible" ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Eligible ({ev.compatibilityScore}%)
                        </Badge>
                      ) : ev.status === "Possibly Eligible" ? (
                        <Badge className="bg-amber-600 text-white text-[10px] font-mono">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Possibly Eligible ({ev.compatibilityScore}%)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] font-mono">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Eligible ({ev.compatibilityScore}%)
                        </Badge>
                      )}
                      <p className="text-[11px] text-muted-foreground">{ev.summaryReason}</p>
                    </td>
                  );
                })}
              </tr>

              {/* 4. Education Level & Courses */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  4. Education Level & Courses
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l">
                    <p className="font-medium">{s.level}</p>
                    <p className="text-muted-foreground mt-0.5">{s.eligible_courses.join(", ")}</p>
                  </td>
                ))}
              </tr>

              {/* 5. Family Income Ceiling */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  5. Max Family Income
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l font-mono">
                    ₹{s.income_limit.toLocaleString("en-IN")} / yr
                  </td>
                ))}
              </tr>

              {/* 6. Academic Requirement */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  6. Min Marks / Academic Rule
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l">
                    <span className="font-mono font-semibold">
                      {s.eligibility.minMarks ?? 60}% min marks
                    </span>
                    <p className="text-muted-foreground mt-0.5">{s.eligibility.description}</p>
                  </td>
                ))}
              </tr>

              {/* 7. Application Deadline */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  7. Official Deadline
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l font-mono font-semibold">
                    {s.deadline} ({s.application_status || "Open"})
                  </td>
                ))}
              </tr>

              {/* 8. Required Documents */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  8. Required Documents
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l">
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {(s.required_documents || []).map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* 9. Application Process & Combinability */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  9. Selection & Combination Rules
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l space-y-1">
                    <p>{s.selection_process || "Merit & document verification on official portal."}</p>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                      {s.combinable_rules || "Check NSP / State portal combination rules."}
                    </p>
                  </td>
                ))}
              </tr>

              {/* 10. Verified Official Source */}
              <tr>
                <td className="p-3.5 font-semibold text-muted-foreground bg-muted/20">
                  10. Verified Official Link
                </td>
                {selectedScholarships.map((s) => (
                  <td key={s.id} className="p-3.5 border-l space-y-2">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{s.verification_status} ({s.last_verified_at})</span>
                    </div>
                    <Button asChild size="sm" className="w-full h-8 text-xs gap-1">
                      <a href={s.apply_link || s.link} target="_blank" rel="noopener noreferrer">
                        <span>Open Official Portal</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
