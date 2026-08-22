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

const prompt = ai.definePrompt({
  name: 'explainScholarshipRecommendationPrompt',
  input: {schema: ExplainScholarshipRecommendationInputSchema},
  output: {schema: ExplainScholarshipRecommendationOutputSchema},
  prompt: `You are an AI assistant that explains why a scholarship was recommended to a user.

  Scholarship Title: {{{scholarshipTitle}}}
  Scholarship Provider: {{{scholarshipProvider}}}
  Scholarship Description: {{{scholarshipDescription}}}

  User Profile: 
  Name: {{{userProfile.name}}}
  Course: {{{userProfile.course}}}
  Income: {{{userProfile.income}}}
  Marks Percentage: {{{userProfile.marks_percent}}}

  Explain why this scholarship was recommended to the user, based on their profile and the scholarship details. Be concise and specific.
  `,
});

const explainScholarshipRecommendationFlow = ai.defineFlow(
  {
    name: 'explainScholarshipRecommendationFlow',
    inputSchema: ExplainScholarshipRecommendationInputSchema,
    outputSchema: ExplainScholarshipRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
