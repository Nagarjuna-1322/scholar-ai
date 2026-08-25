'use server';

/**
 * @fileOverview An AI agent to automatically generate scholarship essays.
 *
 * - generateScholarshipEssay - A function that generates scholarship essays.
 * - GenerateScholarshipEssayInput - The input type for the generateScholarshipEssay function.
 * - GenerateScholarshipEssayOutput - The return type for the generateScholarshipEssay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScholarshipEssayInputSchema = z.object({
  scholarshipName: z.string().describe('The name of the scholarship to apply for.'),
  userProfile: z.object({
    name: z.string().describe('The applicants name.'),
    course: z.string().describe('The course the applicant is studying.'),
    income: z.number().describe('The applicants family income.'),
    category: z.string().describe('The applicants category (e.g., General, SC, ST, OBC).'),
    marks_percent: z.number().describe('The applicants marks in percentage.'),
    essayPrompt: z.string().describe('The essay prompt or topic for the scholarship application.'),
  }).describe('The user profile information.'),
});
export type GenerateScholarshipEssayInput = z.infer<typeof GenerateScholarshipEssayInputSchema>;

const GenerateScholarshipEssayOutputSchema = z.object({
  essay: z.string().describe('The generated scholarship essay.'),
});
export type GenerateScholarshipEssayOutput = z.infer<typeof GenerateScholarshipEssayOutputSchema>;

export async function generateScholarshipEssay(input: GenerateScholarshipEssayInput): Promise<GenerateScholarshipEssayOutput> {
  return generateScholarshipEssayFlow(input);
}

const generateScholarshipEssayFlow = ai.defineFlow(
  {
    name: 'generateScholarshipEssayFlow',
    inputSchema: GenerateScholarshipEssayInputSchema,
    outputSchema: GenerateScholarshipEssayOutputSchema,
  },
  async input => {
    try {
      const response = await ai.generate({
        prompt: `You are an expert scholarship essay writer.
You will generate a compelling, inspiring, and persuasive scholarship essay based on the user's profile and the scholarship's essay prompt.

Scholarship Name: ${input.scholarshipName}
Essay Prompt: ${input.userProfile.essayPrompt}

User Profile:
- Name: ${input.userProfile.name || 'Applicant'}
- Course: ${input.userProfile.course}
- Annual Family Income: ₹${input.userProfile.income.toLocaleString()}
- Category: ${input.userProfile.category || 'General'}
- Academic Marks: ${input.userProfile.marks_percent}%

Write a well-structured 3-4 paragraph essay that highlights the applicant's academic journey, resilience, dedication, and clear future goals aligned with this scholarship opportunity.`,
        output: {
          schema: GenerateScholarshipEssayOutputSchema,
        },
      });

      if (response.output?.essay) {
        return response.output;
      }
      return {
        essay: `To the Selection Committee,\n\nI am writing to express my earnest enthusiasm for the ${input.scholarshipName}. As a dedicated student pursuing my studies in ${input.userProfile.course} with a ${input.userProfile.marks_percent}% academic record, this opportunity directly supports my career ambitions.\n\nReceiving this scholarship would significantly alleviate financial obstacles for my family and empower me to focus entirely on academic excellence and community impact.\n\nSincerely,\n${input.userProfile.name || 'Scholarship Applicant'}`,
      };
    } catch (err) {
      console.warn("AI essay generation error, using fallback draft:", err);
      return {
        essay: `To the Selection Committee,\n\nI am writing to express my earnest enthusiasm for the ${input.scholarshipName}. As a dedicated student pursuing my studies in ${input.userProfile.course} with a ${input.userProfile.marks_percent}% academic record, this opportunity directly supports my career ambitions.\n\nReceiving this scholarship would significantly alleviate financial obstacles for my family and empower me to focus entirely on academic excellence and community impact.\n\nSincerely,\n${input.userProfile.name || 'Scholarship Applicant'}`,
      };
    }
  }
);

