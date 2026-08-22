'use server';

/**
 * @fileOverview A flow that uses natural language to search for scholarships.
 *
 * - intelligentScholarshipSearch - A function that handles the scholarship search process.
 * - IntelligentScholarshipSearchInput - The input type for the intelligentScholarshipSearch function.
 * - IntelligentScholarshipSearchOutput - The return type for the intelligentScholarshipSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentScholarshipSearchInputSchema = z.object({
  query: z.string().describe('The natural language query to search for scholarships.'),
  scholarships: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      provider: z.string(),
      eligible_courses: z.array(z.string()),
      income_limit: z.number(),
      deadline: z.string(),
      description: z.string(),
      apply_link: z.string(),
      tags: z.array(z.string()),
    })
  ).describe('The list of scholarships to search through.'),
});
export type IntelligentScholarshipSearchInput = z.infer<typeof IntelligentScholarshipSearchInputSchema>;

const IntelligentScholarshipSearchOutputSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    provider: z.string(),
    eligible_courses: z.array(z.string()),
    income_limit: z.number(),
    deadline: z.string(),
    description: z.string(),
    apply_link: z.string(),
    tags: z.array(z.string()),
  })
);
export type IntelligentScholarshipSearchOutput = z.infer<typeof IntelligentScholarshipSearchOutputSchema>;

export async function intelligentScholarshipSearch(input: IntelligentScholarshipSearchInput): Promise<IntelligentScholarshipSearchOutput> {
  return intelligentScholarshipSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentScholarshipSearchPrompt',
  input: {schema: IntelligentScholarshipSearchInputSchema},
  output: {schema: IntelligentScholarshipSearchOutputSchema},
  prompt: `You are an AI assistant helping students find scholarships.

You will be given a natural language query and a list of scholarships.

You will return a list of scholarships that match the query, formatted as a JSON array.

Query: {{{query}}}

Scholarships: {{{JSON.stringify(scholarships)}}}

Return only the scholarships that are relevant to the query. Ensure the output is a valid JSON array. If no scholarships match, return an empty array.`,
});

const intelligentScholarshipSearchFlow = ai.defineFlow(
  {
    name: 'intelligentScholarshipSearchFlow',
    inputSchema: IntelligentScholarshipSearchInputSchema,
    outputSchema: IntelligentScholarshipSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
