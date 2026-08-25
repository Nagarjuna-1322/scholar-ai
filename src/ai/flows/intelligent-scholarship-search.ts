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

const ScholarshipItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  provider: z.string(),
  eligible_courses: z.array(z.string()),
  income_limit: z.number(),
  deadline: z.string(),
  description: z.string(),
  apply_link: z.string(),
  tags: z.array(z.string()),
});

const IntelligentScholarshipSearchInputSchema = z.object({
  query: z.string().describe('The natural language query to search for scholarships.'),
  scholarships: z.array(ScholarshipItemSchema).describe('The list of scholarships to search through.'),
});
export type IntelligentScholarshipSearchInput = z.infer<typeof IntelligentScholarshipSearchInputSchema>;

const IntelligentScholarshipSearchOutputSchema = z.array(ScholarshipItemSchema);
export type IntelligentScholarshipSearchOutput = z.infer<typeof IntelligentScholarshipSearchOutputSchema>;

export async function intelligentScholarshipSearch(input: IntelligentScholarshipSearchInput): Promise<IntelligentScholarshipSearchOutput> {
  return intelligentScholarshipSearchFlow(input);
}

function localKeywordSearch(query: string, scholarships: IntelligentScholarshipSearchInput['scholarships']) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return scholarships;

  return scholarships.filter(s => {
    const searchableText = `${s.title} ${s.provider} ${s.description} ${s.eligible_courses.join(' ')} ${s.tags.join(' ')}`.toLowerCase();
    return terms.some(term => searchableText.includes(term));
  });
}

const intelligentScholarshipSearchFlow = ai.defineFlow(
  {
    name: 'intelligentScholarshipSearchFlow',
    inputSchema: IntelligentScholarshipSearchInputSchema,
    outputSchema: IntelligentScholarshipSearchOutputSchema,
  },
  async input => {
    try {
      const response = await ai.generate({
        prompt: `You are an AI scholarship matcher. Match and filter scholarships based on the user's natural language search query.

User Query: "${input.query}"

Scholarships Pool:
${JSON.stringify(input.scholarships, null, 2)}

Instructions:
- Return all scholarships from the pool that match the user query's criteria (such as degree level, subject area, merit/need, provider, or tags).
- If the user query is broad or general, return the most relevant ones.
- Output MUST strictly match the schema as a JSON array of scholarship objects.`,
        output: {
          schema: IntelligentScholarshipSearchOutputSchema,
        },
      });

      if (response.output && Array.isArray(response.output) && response.output.length > 0) {
        return response.output;
      }
      // If AI returns empty or null, fallback to keyword matching
      return localKeywordSearch(input.query, input.scholarships);
    } catch (err) {
      console.warn("AI generation error in scholarship search, using fallback search:", err);
      return localKeywordSearch(input.query, input.scholarships);
    }
  }
);

