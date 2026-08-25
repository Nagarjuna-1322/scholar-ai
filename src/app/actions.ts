"use server";

import { intelligentScholarshipSearch } from "@/ai/flows/intelligent-scholarship-search";
import { explainScholarshipRecommendation } from "@/ai/flows/personalized-scholarship-explanation";
import { generateScholarshipEssay } from "@/ai/flows/automated-essay-generation";
import type { Scholarship } from "@/lib/data";
import type { UserProfile } from "@/contexts/ProfileContext";

export async function searchScholarshipsAction(query: string, scholarships: Scholarship[]): Promise<Scholarship[]> {
  if (!query || !query.trim()) {
    return scholarships;
  }
  try {
    const results = await intelligentScholarshipSearch({ query, scholarships });
    if (Array.isArray(results)) {
      return results;
    }
    return scholarships;
  } catch (error) {
    console.error("Error in intelligent scholarship search:", error);
    // Return fallback filtered scholarships rather than crashing
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return scholarships.filter(s => {
      const text = `${s.title} ${s.provider} ${s.description} ${s.eligible_courses.join(' ')} ${s.tags.join(' ')}`.toLowerCase();
      return terms.some(t => text.includes(t));
    });
  }
}

export async function explainRecommendationAction(scholarship: Scholarship, profile: UserProfile): Promise<string> {
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
    return `This scholarship aligns with your ${profile.course} program and academic credentials (${profile.marks_percent}%).`;
  }
}

export async function generateEssayAction(scholarship: Scholarship, profile: UserProfile, essayPrompt: string): Promise<string> {
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
    return `To the Selection Committee,\n\nI am writing to express my strong interest in the ${scholarship.title}. Pursuing my education in ${profile.course} with an academic record of ${profile.marks_percent}%, I am committed to making meaningful contributions to my field.\n\nThank you for considering my application.\n\nSincerely,\n${profile.name || 'Scholarship Applicant'}`;
  }
}

