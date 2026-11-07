"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  X,
  Sparkles,
  GraduationCap,
  Building2,
  Landmark,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  History,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { evaluateScholarshipEligibility, EligibilityEvaluation } from "@/lib/eligibilityEngine";
import { Scholarship } from "@/lib/data";
import { daysUntil, cn } from "@/lib/utils";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";

type SearchFilterType = "all" | "eligible" | "govt" | "private" | "urgent";

interface MatchResult {
  scholarship: Scholarship;
  evaluation: EligibilityEvaluation;
  daysLeft: number;
}

export function ScholarshipSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { scholarships } = useScholarships();
  const { profile, setProfileOpen } = useProfile();
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scholarai_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("scholarai_recent_searches", JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use shared deterministic eligibility engine
  const processedScholarships: MatchResult[] = useMemo(() => {
    return scholarships.map((s) => ({
      scholarship: s,
      evaluation: evaluateScholarshipEligibility(profile, s),
      daysLeft: daysUntil(s.deadline),
    }));
  }, [scholarships, profile]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const tokens = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];

    let list = processedScholarships;

    if (tokens.length > 0) {
      list = list.filter(({ scholarship: s }) => {
        const searchCorpus = [
          s.title,
          s.provider,
          s.category,
          String(s.amount),
          s.description,
          s.region,
          s.level,
          s.field_of_study,
          ...s.eligible_courses,
          ...s.eligible_categories,
          ...s.tags,
        ]
          .join(" ")
          .toLowerCase();

        return tokens.every((token) => searchCorpus.includes(token));
      });
    }

    if (activeFilter === "eligible") {
      list = list.filter((r) => r.evaluation.status === "Eligible");
    } else if (activeFilter === "govt") {
      list = list.filter((r) => r.scholarship.category === "Government");
    } else if (activeFilter === "private") {
      list = list.filter((r) => r.scholarship.category === "Private");
    } else if (activeFilter === "urgent") {
      list = list.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 21);
    }

    return list.sort((a, b) => {
      if (b.evaluation.compatibilityScore !== a.evaluation.compatibilityScore) {
        return b.evaluation.compatibilityScore - a.evaluation.compatibilityScore;
      }
      return a.daysLeft - b.daysLeft;
    });
  }, [processedScholarships, query, activeFilter]);

  const suggestedRecommendations = useMemo(() => {
    return processedScholarships
      .filter((r) => r.evaluation.status === "Eligible" && r.daysLeft > 0)
      .sort((a, b) => b.evaluation.compatibilityScore - a.evaluation.compatibilityScore)
      .slice(0, 3);
  }, [processedScholarships]);

  const handleSelectScholarship = (scholarship: Scholarship) => {
    saveRecentSearch(scholarship.title);
    setSelectedScholarship(scholarship);
    setIsDetailOpen(true);
    setIsOpen(false);
  };

  const handleExploreInDirectory = (searchTerm?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (q) saveRecentSearch(q);
    setIsOpen(false);

    if (pathname === "/dashboard") {
      const event = new CustomEvent("scholarai:set_search", { detail: { query: q } });
      window.dispatchEvent(event);
      const directoryEl = document.getElementById("scholarship-directory-section");
      if (directoryEl) {
        directoryEl.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/dashboard?search=${encodeURIComponent(q)}`);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    const maxItems = Math.min(searchResults.length, 8);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < maxItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectScholarship(searchResults[selectedIndex].scholarship);
      } else {
        handleExploreInDirectory();
      }
    }
  };

  const popularTags = [
    { label: "Telangana ePASS", query: "Telangana" },
    { label: "B.Tech / AICTE", query: "AICTE" },
    { label: "NSP Central", query: "NSP" },
    { label: "Women in STEM", query: "women" },
    { label: "MahaDBT / SSP", query: "Post-Matric" },
    { label: "Tata & Reliance", query: "Foundation" },
  ];

  return (
    <>
      <div ref={containerRef} className="relative w-full">
        <div
          className={cn(
            "group flex items-center gap-2 h-9 px-3 rounded-lg border bg-background shadow-2xs transition-all duration-200",
            isOpen
              ? "border-primary ring-2 ring-primary/20 shadow-md"
              : "border-border hover:border-primary/40"
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-primary transition-colors" />

          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDownInput}
            placeholder={t("dashboard.searchPlaceholder")}
            className="h-6 border-0 p-0 shadow-none focus-visible:ring-0 text-xs placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-slate-100"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 pointer-events-none select-none rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
              ⌘K
            </kbd>
          )}
        </div>

        {isOpen && (
          <div className="absolute right-0 sm:left-0 top-full mt-2 w-[92vw] sm:w-[520px] md:w-[580px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0",
                  activeFilter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                )}
              >
                All ({processedScholarships.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("eligible")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0",
                  activeFilter === "eligible"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50"
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                Eligible ({processedScholarships.filter((r) => r.evaluation.status === "Eligible").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("govt")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0",
                  activeFilter === "govt"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                )}
              >
                <Landmark className="h-3 w-3" />
                Government
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("private")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0",
                  activeFilter === "private"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60"
                )}
              >
                <Building2 className="h-3 w-3" />
                CSR / Private
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("urgent")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0",
                  activeFilter === "urgent"
                    ? "bg-amber-600 text-white"
                    : "text-amber-700 dark:text-amber-400 hover:bg-amber-50"
                )}
              >
                <Clock className="h-3 w-3" />
                Closing Soon
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {!query.trim() && (
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Top Deterministic Matches ({profile.course}, {profile.state})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setProfileOpen(true);
                        }}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Edit profile
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {suggestedRecommendations.map(({ scholarship: s, evaluation, daysLeft }) => (
                        <div
                          key={s.id}
                          onClick={() => handleSelectScholarship(s)}
                          className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 pr-2">
                            <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              {s.category === "Government" ? (
                                <Landmark className="h-4 w-4" />
                              ) : (
                                <Building2 className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate block group-hover:text-primary">
                                {s.title}
                              </span>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {s.provider} • <span className="font-mono font-medium text-slate-700 dark:text-slate-300">₹{s.amount.toLocaleString("en-IN")}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-1">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono">
                              {evaluation.compatibilityScore}% Compatibility
                            </Badge>
                            <span className="text-[10px] text-slate-400 mt-1">
                              {daysLeft > 0 ? `${daysLeft}d left` : "Archived"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Quick Filters & State Portals
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => {
                            setQuery(tag.query);
                            inputRef.current?.focus();
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recentSearches.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <History className="h-3 w-3" /> Recent Searches
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              setQuery(term);
                              inputRef.current?.focus();
                            }}
                            className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {query.trim() && searchResults.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-semibold">No verified scholarships found for &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-muted-foreground">
                    Try searching for &ldquo;Telangana&rdquo;, &ldquo;B.Tech&rdquo;, &ldquo;AICTE&rdquo;, or &ldquo;NSP&rdquo;.
                  </p>
                </div>
              )}

              {query.trim() && searchResults.length > 0 && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {searchResults.slice(0, 8).map((result, idx) => {
                    const { scholarship: s, evaluation, daysLeft } = result;
                    const isSelected = selectedIndex === idx;

                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectScholarship(s)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "group p-3 sm:px-4 flex items-start justify-between gap-3 cursor-pointer transition-all",
                          isSelected
                            ? "bg-primary/5 dark:bg-primary/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary">
                              {s.title}
                            </h4>
                            {evaluation.status === "Eligible" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] px-1.5 py-0">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                Eligible ({evaluation.compatibilityScore}%)
                              </Badge>
                            ) : evaluation.status === "Possibly Eligible" ? (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] px-1.5 py-0">
                                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                Possibly Eligible ({evaluation.compatibilityScore}%)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                Not Eligible
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {s.provider} • <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">₹{s.amount.toLocaleString("en-IN")}</span> • {s.region}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                            <GraduationCap className="h-3 w-3" />
                            <span>{s.eligible_courses.slice(0, 3).join(", ")}</span>
                            <span>• Income ≤ ₹{(s.income_limit / 100000).toFixed(1)}L</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {daysLeft > 0 ? `${daysLeft}d left` : `Closed (${s.deadline})`}
                          </span>
                          <div className="flex items-center gap-0.5 text-[11px] text-primary font-medium mt-2">
                            <span>Inspect</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-2 px-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground">
                Verified Catalog • Profile Compatibility Engine
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleExploreInDirectory()}
                className="gap-1.5 text-primary font-medium text-xs h-7"
              >
                <span>Filter all {searchResults.length} in Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
  );
}
