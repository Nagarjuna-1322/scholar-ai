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
    name: z.string().describe('The applicant\s name.'),
    course: z.string().describe('The course the applicant is studying.'),
    income: z.number().describe('The applicant\s family income.'),
    category: z.string().describe('The applicant\s category (e.g., General, SC, ST, OBC).'),
    marks_percent: z.number().describe('The applicant\s marks in percentage.'),
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

const prompt = ai.definePrompt({
  name: 'generateScholarshipEssayPrompt',
  input: {schema: GenerateScholarshipEssayInputSchema},
  output: {schema: GenerateScholarshipEssayOutputSchema},
  prompt: `You are an expert scholarship essay writer.
  You will generate a compelling and persuasive scholarship essay based on the user's profile and the scholarship's essay prompt.

  Scholarship Name: {{{scholarshipName}}}
  Essay Prompt: {{{userProfile.essayPrompt}}}

  User Profile:
  - Name: {{{userProfile.name}}}
  - Course: {{{userProfile.course}}}
  - Income: {{{userProfile.income}}}
  - Category: {{{userProfile.category}}}
  - Marks: {{{userProfile.marks_percent}}}%

  Write a well-structured essay that highlights the user's strengths, achievements, and suitability for the scholarship. The essay should be engaging, error-free, and tailored to the scholarship's requirements. Focus on making the essay concise but comprehensive.
  Essay:
  `,
});

const generateScholarshipEssayFlow = ai.defineFlow(
  {
    name: 'generateScholarshipEssayFlow',
    inputSchema: GenerateScholarshipEssayInputSchema,
    outputSchema: GenerateScholarshipEssayOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
