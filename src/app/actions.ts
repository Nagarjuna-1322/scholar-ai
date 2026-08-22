"use server";

import { intelligentScholarshipSearch } from "@/ai/flows/intelligent-scholarship-search";
import { explainScholarshipRecommendation } from "@/ai/flows/personalized-scholarship-explanation";
import { generateScholarshipEssay } from "@/ai/flows/automated-essay-generation";
import type { Scholarship } from "@/lib/data";
import type { UserProfile } from "@/contexts/ProfileContext";

export async function searchScholarshipsAction(query: string, scholarships: Scholarship[]) {
  if (!query) {
    return scholarships;
  }
  try {
    return await intelligentScholarshipSearch({ query, scholarships });
  } catch (error) {
    console.error("Error in intelligent scholarship search:", error);
    // Return a structured error object
    return { error: "Failed to perform AI search. Please try again." };
  }
}

export async function explainRecommendationAction(scholarship: Scholarship, profile: UserProfile) {
  try {
    const result = await explainScholarshipRecommendation({
      scholarshipTitle: scholarship.title,
      scholarshipProvider: scholarship.provider,
      scholarshipDescription: scholarship.description,
      userProfile: {
        name: profile.name,
        course: profile.course,
        income: profile.income,
        marks_percent: profile.marks_percent,
      },
    });
    return result.explanation;
  } catch (error) {
    console.error("Error explaining recommendation:", error);
    return "Could not generate an explanation at this time.";
  }
}

export async function generateEssayAction(scholarship: Scholarship, profile: UserProfile, essayPrompt: string) {
  try {
    const result = await generateScholarshipEssay({
      scholarshipName: scholarship.title,
      userProfile: {
        ...profile,
        essayPrompt: essayPrompt || `Why I am a suitable candidate for the ${scholarship.title}.`,
      },
    });
    return result.essay;
  } catch (error) {
    console.error("Error generating essay:", error);
    return "Could not generate an essay at this time.";
  }
}
