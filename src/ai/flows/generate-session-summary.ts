'use server';
/**
 * @fileOverview An AI agent that generates compassionate, parent-friendly summaries
 * in Arabic from therapy session notes.
 *
 * - generateSessionSummary - A function that handles the session summary generation process.
 * - GenerateSessionSummaryInput - The input type for the generateSessionSummary function.
 * - GenerateSessionSummaryOutput - The return type for the generateSessionSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSessionSummaryInputSchema = z.object({
  sessionNotes: z.string().describe('Detailed therapy session notes in Arabic or English.'),
});
export type GenerateSessionSummaryInput = z.infer<typeof GenerateSessionSummaryInputSchema>;

const GenerateSessionSummaryOutputSchema = z.object({
  summary: z.string().describe('A compassionate, parent-friendly summary of the session notes in Arabic.'),
});
export type GenerateSessionSummaryOutput = z.infer<typeof GenerateSessionSummaryOutputSchema>;

export async function generateSessionSummary(input: GenerateSessionSummaryInput): Promise<GenerateSessionSummaryOutput> {
  return generateSessionSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSessionSummaryPrompt',
  input: {schema: GenerateSessionSummaryInputSchema},
  output: {schema: GenerateSessionSummaryOutputSchema},
  prompt: `أنت مساعد ذكاء اصطناعي مكلف بتلخيص ملاحظات جلسات العلاج لأولياء الأمور.
هدفك هو تحويل الملاحظات السريرية التفصيلية إلى ملخص حانٍ، مشجع، وسهل الفهم باللغة العربية.
سلط الضوء على التقدم الرئيسي، الملاحظات الإيجابية، والخطوات التالية بلغة صديقة للوالدين.
تجنب المصطلحات المعقدة وركز على الصياغة الإيجابية.

ملاحظات الجلسة: {{{sessionNotes}}}

قم بإنشاء ملخص باللغة العربية موجه لولي الأمر بناءً على الملاحظات أعلاه:`,
});

const generateSessionSummaryFlow = ai.defineFlow(
  {
    name: 'generateSessionSummaryFlow',
    inputSchema: GenerateSessionSummaryInputSchema,
    outputSchema: GenerateSessionSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
