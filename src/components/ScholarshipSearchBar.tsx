"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Sparkles,
  Clock,
  ArrowRight,
  GraduationCap,
  Building2,
  Landmark,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Flame,
  BookOpen,
  Filter,
  History,
  TrendingUp,
  ExternalLink,
  Award,
} from "lucide-react";
import { Scholarship } from "@/lib/data";
import { useScholarships } from "@/contexts/ScholarshipContext";
import { useProfile, UserProfile } from "@/contexts/ProfileContext";
import { useApplicationTracker } from "@/contexts/ApplicationTrackerContext";
import { ScholarshipDetail } from "@/components/ScholarshipDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { daysUntil, cn } from "@/lib/utils";

const POPULAR_SEARCHES = [
  "National Scholarship Portal",
  "Reliance Foundation",
  "Tata Trusts",
  "AICTE Pragati",
  "B.Tech & Engineering",
  "Medical & MBBS",
  "Post Matric Welfare",
  "Merit Need-Based",
];

const RECENT_SEARCHES_STORAGE_KEY = "scholarai_recent_searches_v1";

interface ScoredMatch extends Scholarship {
  isProfileMatch: boolean;
  matchScore: number;
  matchReasons: string[];
}

// Compute match score and reasons for a scholarship based on current profile
function evaluateProfileMatch(scholarship: Scholarship, profile: UserProfile): {
  isProfileMatch: boolean;
  matchScore: number;
  matchReasons: string[];
} {
  const reasons: string[] = [];
  let score = 50; // base score for active scheme

  const userCourse = (profile.course || "").toLowerCase();
  const matchesCourse =
    !userCourse ||
    scholarship.eligible_courses.some(
      (c) =>
        userCourse.includes(c.toLowerCase()) ||
        c.toLowerCase().includes(userCourse) ||
        c.toLowerCase().includes("any") ||
        c.toLowerCase().includes("all")
    );

  if (matchesCourse) {
    score += 25;
    if (profile.course) reasons.push(`Matches course: ${profile.course}`);
  }

  if (profile.income <= scholarship.income_limit) {
    score += 15;
    reasons.push(`Income under limit`);
  }

  if (profile.marks_percent >= 75 && scholarship.tags.includes("merit")) {
    score += 10;
    reasons.push(`Merit eligible (${profile.marks_percent}%)`);
  }

  const isProfileMatch = matchesCourse && profile.income <= scholarship.income_limit;

  return {
    isProfileMatch,
    matchScore: Math.min(score, 99),
    matchReasons: reasons,
  };
}

export function ScholarshipSearchBar() {
  const router = useRouter();
  const { scholarships } = useScholarships();
  const { profile, setProfileOpen } = useProfile();
  const { getStatus } = useApplicationTracker();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "eligible" | "govt" | "private" | "urgent">("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Selected scholarship for direct detail sheet modal
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    if (!term || term.trim().length < 2) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Global keyboard shortcut to focus search: Cmd+K / Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recommendations tailored for zero-query state
  const recommendedForUser = useMemo(() => {
    return scholarships
      .map((s) => {
        const evalResult = evaluateProfileMatch(s, profile);
        return {
          ...s,
          ...evalResult,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3);
  }, [scholarships, profile]);

  // Filtered & scored search results
  const searchResults: ScoredMatch[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // Base filtering
    let matched = scholarships.map((s) => {
      const evalResult = evaluateProfileMatch(s, profile);
      return {
        ...s,
        ...evalResult,
      };
    });

    if (trimmed) {
      matched = matched.filter((s) => {
        const titleMatch = s.title.toLowerCase().includes(trimmed);
        const providerMatch = s.provider.toLowerCase().includes(trimmed);
        const descMatch = s.description.toLowerCase().includes(trimmed);
        const amountMatch = s.amount.toLowerCase().includes(trimmed);
        const courseMatch = s.eligible_courses.some((c) => c.toLowerCase().includes(trimmed));
        const tagMatch = s.tags.some((t) => t.toLowerCase().includes(trimmed));
        const catMatch = s.category.toLowerCase().includes(trimmed);
        const portalMatch = s.source_portal ? s.source_portal.toLowerCase().includes(trimmed) : false;

        return (
          titleMatch ||
          providerMatch ||
          descMatch ||
          amountMatch ||
          courseMatch ||
          tagMatch ||
          catMatch ||
          portalMatch
        );
      });
    }

    // Secondary filter tabs
    if (activeFilter === "eligible") {
      matched = matched.filter((s) => s.isProfileMatch);
    } else if (activeFilter === "govt") {
      matched = matched.filter((s) => s.category === "Government");
    } else if (activeFilter === "private") {
      matched = matched.filter((s) => s.category === "Private");
    } else if (activeFilter === "urgent") {
      matched = matched.filter((s) => {
        const days = daysUntil(s.deadline);
        return days >= 0 && days <= 15;
      });
    }

    // Sort by match score and urgency
    return matched.sort((a, b) => {
      // If query exists, prioritize title match first
      if (trimmed) {
        const aTitle = a.title.toLowerCase().includes(trimmed);
        const bTitle = b.title.toLowerCase().includes(trimmed);
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
      }
      return b.matchScore - a.matchScore;
    });
  }, [scholarships, query, activeFilter, profile]);

  // Counts for filter tabs
  const filterCounts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base = trimmed
      ? scholarships.filter((s) => {
          return (
            s.title.toLowerCase().includes(trimmed) ||
            s.provider.toLowerCase().includes(trimmed) ||
            s.description.toLowerCase().includes(trimmed) ||
            s.eligible_courses.some((c) => c.toLowerCase().includes(trimmed)) ||
            s.tags.some((t) => t.toLowerCase().includes(trimmed))
          );
        })
      : scholarships;

    return {
      all: base.length,
      eligible: base.filter((s) => evaluateProfileMatch(s, profile).isProfileMatch).length,
      govt: base.filter((s) => s.category === "Government").length,
      private: base.filter((s) => s.category === "Private").length,
      urgent: base.filter((s) => {
        const days = daysUntil(s.deadline);
        return days >= 0 && days <= 15;
      }).length,
    };
  }, [scholarships, query, profile]);

  // Keyboard navigation inside results list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    const maxIndex = searchResults.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelectScholarship(searchResults[selectedIndex]);
      } else if (query.trim()) {
        handleViewAllInDirectory();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectScholarship = (scholarship: Scholarship) => {
    saveRecentSearch(scholarship.title);
    setSelectedScholarship(scholarship);
    setDetailOpen(true);
    setIsOpen(false);
  };

  const handleViewAllInDirectory = () => {
    saveRecentSearch(query);
    setIsOpen(false);

    // Broadcast search query event to dashboard and navigate
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scholarship-search-query", {
          detail: { query: query.trim() },
        })
      );
    }
    router.push(`/dashboard?search=${encodeURIComponent(query.trim())}`);
  };

  const handleQuickSearchTag = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <>
      <div ref={containerRef} className="relative w-full max-w-[220px] sm:max-w-xs md:max-w-sm lg:max-w-md">
        {/* Search Bar Input */}
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50/80 dark:bg-slate-900/60 transition-all duration-200 shadow-xs",
            "hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700",
            isOpen
              ? "ring-2 ring-primary/20 border-primary bg-white dark:bg-slate-900 shadow-md"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <Search
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isOpen ? "text-primary" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            )}
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search scholarships..."
            className="w-full bg-transparent text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden text-slate-800 dark:text-slate-100"
            aria-label="Search scholarships"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs select-none">
              <span className="text-[10px]">⌘</span>K
            </kbd>
          )}
        </div>

        {/* Dropdown Results Box */}
        {isOpen && (
          <div className="absolute top-full right-0 sm:right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[500px] md:w-[580px] lg:w-[640px] max-w-[95vw] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Toolbar / Filter Tabs */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {query.trim()
                      ? `Found ${searchResults.length} scholarships`
                      : "Search & Discover Scholarships"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <UserCheck className="h-3 w-3 text-emerald-600" />
                  <span>
                    Profile:{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {profile.course || "All Courses"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                    activeFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  All ({filterCounts.all})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("eligible")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                    activeFilter === "eligible"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/70 border border-emerald-200/60 dark:border-emerald-800/60"
                  )}
                >
                  <Award className="h-3 w-3" />
                  Eligible for Me ({filterCounts.eligible})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("govt")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                    activeFilter === "govt"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  Government ({filterCounts.govt})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("private")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0",
                    activeFilter === "private"
                      ? "bg-purple-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  Private / CSR ({filterCounts.private})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter("urgent")}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                    activeFilter === "urgent"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <Flame className="h-3 w-3 text-rose-500" />
                  Closing Soon ({filterCounts.urgent})
                </button>
              </div>
            </div>

            {/* Results Scroll Area */}
            <div
              ref={resultsContainerRef}
              className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-2"
            >
              {/* Zero-Query State: Tailored Recommendations & Popular Search Pills */}
              {!query.trim() && (
                <div className="p-2 space-y-4">
                  {/* Top Match for Your Profile */}
                  <div>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <Award className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Tailored for your profile</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setProfileOpen(true);
                        }}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Edit criteria
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {recommendedForUser.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectScholarship(item)}
                          className="group relative p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className="bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] py-0 px-1.5 font-medium border-emerald-300 dark:border-emerald-700"
                              >
                                {item.matchScore}% Match
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 bg-slate-100 dark:bg-slate-800"
                              >
                                {item.category}
                              </Badge>
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                {item.amount}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span>{item.provider}</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                              <span>{daysUntil(item.deadline)} days left</span>
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches (if any) */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <History className="h-3 w-3" />
                          Recent searches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <span
                            key={term}
                            onClick={() => handleQuickSearchTag(term)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          >
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, term)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-2 px-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      Popular searches
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleQuickSearchTag(term)}
                          className="px-2.5 py-1 rounded-full text-xs bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-left"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Active Search Results */}
              {query.trim() && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((item, index) => {
                    const daysLeft = daysUntil(item.deadline);
                    const trackerStatus = getStatus(item.id);
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectScholarship(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "group p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3",
                          isSelected
                            ? "bg-primary/10 dark:bg-primary/20 border-l-4 border-primary pl-2.5"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          {/* Badges line */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] py-0 px-1.5 font-medium",
                                item.category === "Government"
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300"
                                  : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300"
                              )}
                            >
                              {item.category === "Government" ? "🏛️ Government" : "🏢 Private"}
                            </Badge>

                            {item.isNew && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] py-0 px-1.5">
                                ✨ New
                              </Badge>
                            )}

                            {item.isProfileMatch && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px] py-0 px-1.5 font-medium flex items-center gap-0.5"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                {item.matchScore}% Match
                              </Badge>
                            )}

                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 ml-auto">
                              {item.amount}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1">
                            {item.title}
                          </h4>

                          {/* Provider & Metadata */}
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 line-clamp-1">
                            <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{item.provider}</span>
                          </p>

                          {/* Matching Reason / Tag chips */}
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded",
                                daysLeft <= 7
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {daysLeft >= 0 ? `${daysLeft} days left` : "Expired"}
                            </span>

                            {item.eligible_courses.slice(0, 2).map((course) => (
                              <span
                                key={course}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                {course}
                              </span>
                            ))}

                            {trackerStatus && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200"
                              >
                                Status: {trackerStatus}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* View Button */}
                        <div className="shrink-0 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all rounded-lg"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Results Found */}
              {query.trim() && searchResults.length === 0 && (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No scholarships match &ldquo;{query}&rdquo;
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Try searching by general keywords like &ldquo;Engineering&rdquo;, &ldquo;Government&rdquo;,
                      &ldquo;Merit&rdquo;, or &ldquo;Tata&rdquo;.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery("")}
                      className="text-xs"
                    >
                      Clear search
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2.5 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                <span>
                  <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 rounded border">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 rounded border">↵</kbd> select
                </span>
                <span>
                  <kbd className="px-1 py-0.5 font-mono text-[10px] bg-white dark:bg-slate-800 rounded border">esc</kbd> close
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewAllInDirectory}
                  className="h-7 text-xs text-primary font-semibold hover:bg-primary/10 gap-1"
                >
                  <span>Explore on Directory</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Scholarship Detail Modal / Sheet */}
      <ScholarshipDetail
        scholarship={selectedScholarship}
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
