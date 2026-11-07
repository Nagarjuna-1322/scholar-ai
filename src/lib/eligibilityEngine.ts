import type { Scholarship } from "@/lib/data";
import type { UserProfile } from "@/contexts/ProfileContext";
import { daysUntil } from "@/lib/utils";

export type EligibilityStatus =
  | "Eligible"
  | "Possibly Eligible"
  | "Not Eligible";

export interface EligibilityEvaluationResult {
  scholarship: Scholarship;
  scholarshipId: number | string;
  status: EligibilityStatus;
  statusLabel:
    | "Eligible based on available verified information"
    | "Possibly eligible / Additional details required"
    | "Not eligible based on known requirements";
  compatibilityScore: number; // 0-100 profile compatibility score (NOT award probability)
  summaryReason: string;
  matchedCriteria: string[];
  unmetCriteria: string[];
  missingInformation: string[];
  missingDocuments: string[];
  daysLeft: number;
  isWindowOpen: boolean;
  evaluation: EligibilityEvaluationResult;
}

export type EligibilityEvaluation = EligibilityEvaluationResult;

const COURSE_SYNONYMS: Record<string, string[]> = {
  engineering: ["engineering", "b.tech", "b.e.", "bachelors", "technical", "technology", "computer science", "stem"],
  bachelors: ["bachelors", "undergraduate", "ug", "general graduation", "b.sc", "b.com", "b.a", "engineering", "medical"],
  masters: ["masters", "postgraduate", "pg", "m.tech", "mba", "m.sc", "m.a"],
  medical: ["medical", "mbbs", "bds", "dental", "nursing", "pharmacy", "bachelors"],
  diploma: ["diploma", "polytechnic", "technical", "certificate", "iti"],
  science: ["science", "b.sc", "m.sc", "research", "stem", "bachelors"],
  phd: ["phd", "research", "doctoral", "masters"],
};

function checkCourseCompatibility(userCourse: string, eligibleCourses: string[]): boolean {
  if (!userCourse || !userCourse.trim()) return false;
  const normUser = userCourse.toLowerCase().trim();
  const expandedUserTokens = new Set<string>([normUser]);

  for (const [key, synonyms] of Object.entries(COURSE_SYNONYMS)) {
    if (normUser.includes(key) || synonyms.some((s) => normUser.includes(s))) {
      expandedUserTokens.add(key);
      synonyms.forEach((s) => expandedUserTokens.add(s));
    }
  }

  return eligibleCourses.some((eligible) => {
    const normEligible = eligible.toLowerCase().trim();
    if (normEligible === "any" || normEligible === "all") return true;
    for (const token of expandedUserTokens) {
      if (normEligible.includes(token) || token.includes(normEligible)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Shared deterministic eligibility evaluation service used across:
 * - Dashboard
 * - AI Matcher
 * - Recommendations
 * - Top Search Bar
 * - Conversational AI Advisor
 * - Scholarship Comparison Table
 */
export function evaluateScholarshipEligibility(
  profile: UserProfile,
  scholarship: Scholarship
): EligibilityEvaluationResult {
  const matchedCriteria: string[] = [];
  const unmetCriteria: string[] = [];
  const missingInformation: string[] = [];

  const daysLeft = daysUntil(scholarship.deadline);
  const isWindowOpen =
    daysLeft >= 0 && scholarship.application_status !== "Closed" && !scholarship.isExpired;

  // 1. Check Application Window
  if (!isWindowOpen) {
    unmetCriteria.push(
      `Application window closed on ${scholarship.deadline} (${scholarship.application_status || "Closed"}).`
    );
  } else {
    matchedCriteria.push(`Application window is active (${daysLeft} days remaining).`);
  }

  // 2. Check Course / Stream
  if (!profile.course || !profile.course.trim()) {
    missingInformation.push("Course / stream of study is not specified in your profile.");
  } else if (checkCourseCompatibility(profile.course, scholarship.eligible_courses)) {
    matchedCriteria.push(
      `Course match: Your program (${profile.course}${
        profile.specialization ? ` - ${profile.specialization}` : ""
      }) aligns with [${scholarship.eligible_courses.slice(0, 4).join(", ")}].`
    );
  } else {
    unmetCriteria.push(
      `Course requirement: Requires [${scholarship.eligible_courses.join(", ")}], whereas your profile lists ${profile.course}.`
    );
  }

  // 3. Check Annual Family Income Ceiling
  if (typeof profile.income !== "number" || isNaN(profile.income)) {
    missingInformation.push("Annual family income is required to verify the income ceiling.");
  } else if (profile.income <= scholarship.income_limit) {
    matchedCriteria.push(
      `Income criteria met: Family income (₹${profile.income.toLocaleString(
        "en-IN"
      )}) is within the ₹${scholarship.income_limit.toLocaleString("en-IN")} ceiling.`
    );
  } else {
    unmetCriteria.push(
      `Income limit exceeded: Family income (₹${profile.income.toLocaleString(
        "en-IN"
      )}) exceeds the maximum limit of ₹${scholarship.income_limit.toLocaleString("en-IN")}.`
    );
  }

  // 4. Check Minimum Academic Marks (%)
  const requiredMarks = scholarship.min_marks_percent ?? 50;
  if (typeof profile.marks_percent !== "number" || profile.marks_percent <= 0) {
    missingInformation.push(`Academic marks (%) needed to verify minimum ${requiredMarks}% cutoff.`);
  } else if (profile.marks_percent >= requiredMarks) {
    matchedCriteria.push(
      `Academic merit met: Your score (${profile.marks_percent}%) meets the ${requiredMarks}% minimum requirement.`
    );
  } else {
    unmetCriteria.push(
      `Minimum marks not met: Requires at least ${requiredMarks}%, whereas your profile shows ${profile.marks_percent}%.`
    );
  }

  // 5. Check Gender Requirement
  if (scholarship.gender_requirement === "Female") {
    if (!profile.gender || profile.gender === "Prefer not to say") {
      missingInformation.push("Gender confirmation required (this is a women-only scholarship scheme).");
    } else if (profile.gender === "Female") {
      matchedCriteria.push("Gender criteria met: Eligible for women-in-education / girl student scheme.");
    } else {
      unmetCriteria.push("Gender requirement: Exclusively for female students.");
    }
  }

  // 6. Check State / Domicile Requirement
  if (
    scholarship.eligible_states &&
    scholarship.eligible_states.length > 0 &&
    !scholarship.eligible_states.includes("All India")
  ) {
    if (!profile.state || !profile.state.trim()) {
      missingInformation.push(
        `State domicile confirmation required (restricted to: ${scholarship.eligible_states.join(", ")}).`
      );
    } else {
      const userStateNorm = profile.state.toLowerCase().trim();
      const stateMatch = scholarship.eligible_states.some(
        (s) => s.toLowerCase().trim() === userStateNorm
      );
      if (stateMatch) {
        matchedCriteria.push(`Domicile match: Open to students from ${profile.state}.`);
      } else {
        unmetCriteria.push(
          `State domicile restriction: Only open to residents of [${scholarship.eligible_states.join(
            ", "
          )}] (your profile lists ${profile.state}).`
        );
      }
    }
  } else {
    matchedCriteria.push("All-India eligibility: Open to students across all Indian states and UTs.");
  }

  // 7. Check Social / Reservation Category Requirement
  if (
    scholarship.eligible_categories &&
    scholarship.eligible_categories.length > 0 &&
    !scholarship.eligible_categories.includes("All")
  ) {
    if (!profile.category) {
      missingInformation.push(
        `Category verification needed (eligible categories: ${scholarship.eligible_categories.join(", ")}).`
      );
    } else {
      const catMatch = scholarship.eligible_categories.some(
        (c) => c.toLowerCase() === profile.category.toLowerCase()
      );
      if (catMatch) {
        matchedCriteria.push(`Category match: Open to ${profile.category} category applicants.`);
      } else {
        unmetCriteria.push(
          `Category restriction: Reserved for [${scholarship.eligible_categories.join(
            ", "
          )}] categories (your profile lists ${profile.category}).`
        );
      }
    }
  }

  // 8. Check Special Conditions (Disability / Armed Forces Ward)
  if (scholarship.disability_required) {
    if (profile.is_specially_abled === true) {
      matchedCriteria.push("Special eligibility met: Qualifying disability status confirmed.");
    } else if (profile.is_specially_abled === false) {
      unmetCriteria.push(
        "Special requirement: Exclusively for specially-abled students (≥ 40% disability certification)."
      );
    } else {
      missingInformation.push("Requires confirmation of ≥ 40% UDID disability certification.");
    }
  }

  if (scholarship.armed_forces_ward_only) {
    if (profile.is_armed_forces_ward === true) {
      matchedCriteria.push("Special eligibility met: Dependent ward of CAPF / Armed Forces personnel.");
    } else if (profile.is_armed_forces_ward === false) {
      unmetCriteria.push(
        "Special requirement: Exclusively for dependent wards/widows of CAPF, Assam Rifles, or State Police personnel."
      );
    } else {
      missingInformation.push("Requires confirmation of CAPF / Armed Forces dependent status.");
    }
  }

  // 9. Academic Year Check (if specified)
  if (scholarship.academic_years && scholarship.academic_years.length > 0) {
    if (!profile.academic_year) {
      missingInformation.push(
        `Academic year confirmation needed (eligible years: ${scholarship.academic_years.join(", ")}).`
      );
    } else if (scholarship.academic_years.includes(profile.academic_year)) {
      matchedCriteria.push(`Academic year match: Open to ${profile.academic_year} students.`);
    } else {
      missingInformation.push(
        `Verify enrollment year: Primarily targets ${scholarship.academic_years.join(
          ", "
        )} (your profile lists ${profile.academic_year}).`
      );
    }
  }

  // 10. Document Readiness Check
  const requiredDocs = scholarship.required_documents || [];
  const userDocs = (profile.completed_documents || []).map((d) => d.toLowerCase());
  const missingDocuments = requiredDocs.filter((reqDoc) => {
    const reqLower = reqDoc.toLowerCase();
    return !userDocs.some(
      (u) =>
        u === reqLower ||
        (reqLower.includes("income") && u.includes("income")) ||
        (reqLower.includes("mark sheet") && u.includes("mark sheet")) ||
        (reqLower.includes("bank") && u.includes("bank")) ||
        (reqLower.includes("bonafide") && u.includes("bonafide")) ||
        (reqLower.includes("caste") && u.includes("caste"))
    );
  });

  // Determine overall deterministic status & compatibility score
  let status: EligibilityStatus;
  let statusLabel: EligibilityEvaluationResult["statusLabel"];
  let compatibilityScore = 0;
  let summaryReason = "";

  if (unmetCriteria.length > 0) {
    status = "Not Eligible";
    statusLabel = "Not eligible based on known requirements";
    const ratio =
      matchedCriteria.length / Math.max(1, matchedCriteria.length + unmetCriteria.length * 2);
    compatibilityScore = Math.max(10, Math.min(45, Math.round(ratio * 60)));
    summaryReason = unmetCriteria[0] || "Does not meet one or more mandatory criteria.";
  } else if (missingInformation.length > 0) {
    status = "Possibly Eligible";
    statusLabel = "Possibly eligible / Additional details required";
    compatibilityScore = Math.max(
      62,
      Math.min(84, 82 - missingInformation.length * 6)
    );
    summaryReason = missingInformation[0] || "Additional profile details needed to confirm eligibility.";
  } else {
    status = "Eligible";
    statusLabel = "Eligible based on available verified information";
    // Fine-tune compatibility between 85 and 98 based on marks margin and income buffer
    let bonus = 0;
    if ((profile.marks_percent ?? 0) >= (scholarship.min_marks_percent ?? 60) + 10) bonus += 5;
    if ((profile.income ?? 0) <= scholarship.income_limit * 0.6) bonus += 5;
    if (missingDocuments.length === 0) bonus += 3;
    compatibilityScore = Math.min(98, 85 + bonus);
    summaryReason = matchedCriteria[0] || "Meets all verified eligibility requirements.";
  }

  const result: EligibilityEvaluationResult = {
    scholarship,
    scholarshipId: scholarship.id,
    status,
    statusLabel,
    compatibilityScore,
    summaryReason,
    matchedCriteria,
    unmetCriteria,
    missingInformation,
    missingDocuments,
    daysLeft,
    isWindowOpen,
    evaluation: null as unknown as EligibilityEvaluationResult,
  };
  result.evaluation = result;
  return result;
}

/**
 * Evaluates and ranks a list of scholarships for a given student profile.
 */
export function evaluateAndRankScholarships(
  profile: UserProfile,
  scholarships: Scholarship[]
): EligibilityEvaluationResult[] {
  const statusWeight: Record<EligibilityStatus, number> = {
    Eligible: 3,
    "Possibly Eligible": 2,
    "Not Eligible": 1,
  };

  return scholarships
    .map((s) => evaluateScholarshipEligibility(profile, s))
    .sort((a, b) => {
      if (statusWeight[b.status] !== statusWeight[a.status]) {
        return statusWeight[b.status] - statusWeight[a.status];
      }
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      if (a.isWindowOpen && !b.isWindowOpen) return -1;
      if (!a.isWindowOpen && b.isWindowOpen) return 1;
      return a.daysLeft - b.daysLeft;
    });
}
