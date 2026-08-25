'use server';

/**
 * @fileOverview Explains why a scholarship was recommended to a user.
 *
 * - explainScholarshipRecommendation - A function that explains the scholarship recommendation.
 * - ExplainScholarshipRecommendationInput - The input type for the explainScholarshipRecommendation function.
 * - ExplainScholarshipRecommendationOutput - The return type for the explainScholarshipRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainScholarshipRecommendationInputSchema = z.object({
  scholarshipTitle: z.string().describe('The title of the scholarship.'),
  scholarshipProvider: z.string().describe('The provider of the scholarship.'),
  scholarshipDescription: z.string().describe('The description of the scholarship.'),
  userProfile: z.object({
    name: z.string().describe('The name of the user.'),
    course: z.string().describe('The course of study of the user.'),
    income: z.number().describe('The income of the user.'),
    marks_percent: z.number().describe('The marks percentage of the user.'),
  }).describe('The profile of the user.'),
});
export type ExplainScholarshipRecommendationInput = z.infer<typeof ExplainScholarshipRecommendationInputSchema>;

const ExplainScholarshipRecommendationOutputSchema = z.object({
  explanation: z.string().describe('The explanation of why the scholarship was recommended to the user.'),
});
export type ExplainScholarshipRecommendationOutput = z.infer<typeof ExplainScholarshipRecommendationOutputSchema>;

export async function explainScholarshipRecommendation(input: ExplainScholarshipRecommendationInput): Promise<ExplainScholarshipRecommendationOutput> {
  return explainScholarshipRecommendationFlow(input);
}

const explainScholarshipRecommendationFlow = ai.defineFlow(
  {
    name: 'explainScholarshipRecommendationFlow',
    inputSchema: ExplainScholarshipRecommendationInputSchema,
    outputSchema: ExplainScholarshipRecommendationOutputSchema,
  },
  async input => {
    try {
      const response = await ai.generate({
        prompt: `You are an AI scholarship advisor. Explain concisely and warmly why this scholarship is a great match for the student.

Scholarship Title: ${input.scholarshipTitle}
Provider: ${input.scholarshipProvider}
Description: ${input.scholarshipDescription}

Student Profile:
- Name: ${input.userProfile.name || "Student"}
- Course / Level: ${input.userProfile.course}
- Annual Family Income: ₹${input.userProfile.income.toLocaleString()}
- Academic Marks: ${input.userProfile.marks_percent}%

Provide a concise, 2-3 sentence personalized explanation highlighting the student's eligibility criteria and strengths.`,
        output: {
          schema: ExplainScholarshipRecommendationOutputSchema,
        },
      });

      if (response.output?.explanation) {
        return response.output;
      }
      return {
        explanation: `This scholarship matches your ${input.userProfile.course} program, academic score (${input.userProfile.marks_percent}%), and financial eligibility criteria from ${input.scholarshipProvider}.`,
      };
    } catch (err) {
      console.warn("AI explanation error, using fallback explanation:", err);
      return {
        explanation: `This scholarship from ${input.scholarshipProvider} matches your current ${input.userProfile.course} enrollment and academic profile (${input.userProfile.marks_percent}%).`,
      };
    }
  }
);

