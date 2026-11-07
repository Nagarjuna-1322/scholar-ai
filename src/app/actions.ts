"use server";

import { GoogleGenAI } from "@google/genai";
import type { Scholarship } from "@/lib/data";
import type { UserProfile } from "@/contexts/ProfileContext";
import { evaluateScholarshipEligibility } from "@/lib/eligibilityEngine";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });
}

export async function searchScholarshipsAction(
  query: string,
  scholarships: Scholarship[]
): Promise<Scholarship[]> {
  if (!query || !query.trim()) {
    return scholarships;
  }
  const normalized = query.trim().toLowerCase();
  const terms = normalized.split(/\s+/).filter(Boolean);

  // Deterministic semantic + keyword ranker first
  const scored = scholarships
    .map((s) => {
      const searchable = [
        s.title,
        s.provider,
        s.description,
        s.region,
        s.level,
        s.field_of_study,
        s.eligible_courses.join(" "),
        s.eligible_categories.join(" "),
        s.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (searchable.includes(normalized)) score += 50;
      for (const t of terms) {
        if (s.title.toLowerCase().includes(t)) score += 20;
        if (s.provider.toLowerCase().includes(t)) score += 15;
        if (s.region.toLowerCase().includes(t)) score += 18;
        if (searchable.includes(t)) score += 8;
      }
      return { scholarship: s, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.scholarship);

  return scored.length > 0 ? scored : scholarships;
}

export async function explainRecommendationAction(
  scholarship: Scholarship,
  profile: UserProfile
): Promise<string> {
  const evaluation = evaluateScholarshipEligibility(profile, scholarship);
  const ai = getAI();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Explain in 2–3 concise sentences how this student's profile matches (or what is unmet for) the "${scholarship.title}" (${scholarship.provider}).
CRITICAL RULES:
- Use the deterministic evaluation below and verify any official scholarship details using Google Search if helpful.
- Refer to the score ONLY as "${evaluation.compatibilityScore}% Profile Compatibility Score" — never as "award probability".
- Do not fabricate criteria.

Deterministic Status: ${evaluation.status} (${evaluation.compatibilityScore}% Profile Compatibility)
Matched Criteria: ${evaluation.matchedCriteria.join("; ")}
Unmet Criteria: ${evaluation.unmetCriteria.join("; ")}
Missing Information: ${evaluation.missingInformation.join("; ")}`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn("explainRecommendationAction fallback:", error);
    }
  }

  const matchedText =
    evaluation.matchedCriteria.length > 0
      ? `Matched requirements: ${evaluation.matchedCriteria.join(" • ")}.`
      : "";
  const unmetText =
    evaluation.unmetCriteria.length > 0
      ? ` Unmet criteria: ${evaluation.unmetCriteria.join(" • ")}.`
      : "";
  return `${evaluation.status} (${evaluation.compatibilityScore}% Profile Compatibility Score). ${matchedText}${unmetText}`;
}

export async function generateEssayAction(
  scholarship: Scholarship,
  profile: UserProfile,
  essayPrompt: string
): Promise<string> {
  const ai = getAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Write a truthful, well-structured scholarship application statement (250–320 words) for "${scholarship.title}" (${scholarship.provider}).
CRITICAL RULE: Use ONLY the student-confirmed profile facts below. Do NOT invent achievements, hardships, or awards not stated by the student.

Student Profile:
- Name: ${profile.fullName || profile.name}
- Course & Specialization: ${profile.course} ${profile.specialization ? `(${profile.specialization})` : ""}
- Education Level & Year: ${profile.education_level || "Undergraduate"}, ${profile.academic_year || "Current Year"}
- Institution: ${profile.institution || "[Your Institution Name]"}
- Marks / CGPA: ${profile.marks_percent ?? "N/A"}% ${profile.cgpa ? `(CGPA: ${profile.cgpa})` : ""}
- Family Annual Income: ₹${(profile.income ?? 0).toLocaleString("en-IN")}
- Domicile State: ${profile.state || "India"}
- Student's Statement Prompt / Context: ${essayPrompt || profile.career_interests || "Academic excellence and financial support for higher studies"}`,
      });
      if (response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn("generateEssayAction fallback:", error);
    }
  }

  return `Statement of Purpose — Application for ${scholarship.title}

To the Scholarship Selection Committee at ${scholarship.provider},

My name is ${profile.fullName || profile.name || "Applicant"}, and I am currently enrolled in ${profile.course}${profile.specialization ? ` (${profile.specialization})` : ""} at ${profile.institution || "[Your Institution Name]"} in ${profile.state || "India"}. I am writing to submit my application for the ${scholarship.title}.

In my qualifying academic examinations, I have secured ${profile.marks_percent ?? "[Marks]"}%${profile.cgpa ? ` with a CGPA of ${profile.cgpa}` : ""}. ${essayPrompt ? `Regarding my academic goals and background: ${essayPrompt}` : `My goal is to excel in ${profile.career_interests || profile.course} and apply my training toward meaningful technical and community contributions.`}

My family's annual income is ₹${(profile.income ?? 0).toLocaleString("en-IN")}. Support from the ${scholarship.title} (₹${scholarship.amount.toLocaleString("en-IN")}) will directly cover my tuition and essential academic materials, enabling me to focus wholeheartedly on my studies.

I confirm that all academic and financial particulars stated above match my official certificates. Thank you for your consideration.

Sincerely,
${profile.fullName || profile.name || "Scholarship Applicant"}`;
}
