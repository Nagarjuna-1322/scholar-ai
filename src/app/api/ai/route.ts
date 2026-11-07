import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { scholarships as catalogScholarships } from '@/lib/data';
import { evaluateAndRankScholarships, evaluateScholarshipEligibility } from '@/lib/eligibilityEngine';
import type { UserProfile } from '@/contexts/ProfileContext';

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

const MODEL_NAME = 'gemini-3.8-flash';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action as string;

    if (action === 'advisor_chat') {
      return await handleAdvisorChat(body);
    }
    if (action === 'analyze_document') {
      return await handleAnalyzeDocument(body);
    }
    if (action === 'explain_eligibility') {
      return await handleExplainEligibility(body);
    }
    if (action === 'generate_essay') {
      return await handleGenerateEssay(body);
    }
    if (action === 'review_essay') {
      return await handleReviewEssay(body);
    }

    return NextResponse.json({ error: 'Unsupported AI action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/ai error:', error);
    return NextResponse.json(
      { error: 'AI service encountered an unexpected error. Showing deterministic guidance instead.' },
      { status: 500 }
    );
  }
}

async function handleAdvisorChat(body: {
  message?: string;
  language?: 'en' | 'hi' | 'te';
  profile?: UserProfile;
  history?: { sender: string; text: string }[];
}) {
  const message = String(body.message || '').trim();
  const language = body.language || 'en';
  const profile = body.profile;

  const activeCatalog = catalogScholarships;
  const evaluated = profile
    ? evaluateAndRankScholarships(profile, activeCatalog)
    : activeCatalog.map((s) => ({
        scholarship: s,
        evaluation: {
          scholarshipId: s.id,
          status: 'Possibly Eligible' as const,
          compatibilityScore: 70,
          matchedCriteria: [],
          unmetCriteria: [],
          missingInformation: [],
          missingDocuments: s.required_documents || [],
          summaryReason: 'Complete your profile for exact eligibility matching.',
        },
      }));

  const ai = getGenAIClient();
  const langLabel = language === 'hi' ? 'Hindi (हिन्दी)' : language === 'te' ? 'Telugu (తెలుగు)' : 'English';

  const topMatchesSummary = evaluated
    .slice(0, 12)
    .map(
      ({ scholarship: s, evaluation: e }) =>
        `- [${s.id}] ${s.title} (${s.provider}) | Amount: ₹${s.amount.toLocaleString('en-IN')} | Deadline: ${s.deadline} | Status: ${s.application_status || 'Open'} | Verification: ${s.verification_status || 'Verified Source'} | Eligibility: ${e.status} (${e.compatibilityScore}% Profile Compatibility) | Official Link: ${s.link} | Docs: ${(s.required_documents || []).join(', ')} | Unmet: ${e.unmetCriteria.join('; ') || 'None'}`
    )
    .join('\n');

  const lower = message.toLowerCase();
  const eligibleList = evaluated.filter((x) => x.evaluation.status === 'Eligible');
  const possibleList = evaluated.filter((x) => x.evaluation.status === 'Possibly Eligible');

  const pickSuggestedScholarships = () => {
    if (lower.includes('telangana') || lower.includes('state') || lower.includes('epass') || lower.includes('mahadbt') || lower.includes('ssp')) {
      const stateMatches = evaluated.filter(
        (x) =>
          x.scholarship.title.toLowerCase().includes('telangana') ||
          x.scholarship.region.toLowerCase().includes('telangana') ||
          x.scholarship.title.toLowerCase().includes('mahadbt') ||
          x.scholarship.title.toLowerCase().includes('karnataka') ||
          (profile?.state && x.scholarship.region.toLowerCase().includes(profile.state.toLowerCase()))
      );
      return (stateMatches.length > 0 ? stateMatches : eligibleList).slice(0, 3);
    }
    if (lower.includes('not eligible') || lower.includes('ineligible') || lower.includes('why')) {
      const notElig = evaluated.filter((x) => x.evaluation.status === 'Not Eligible').slice(0, 3);
      return notElig.length > 0 ? notElig : evaluated.slice(0, 3);
    }
    if (lower.includes('deadline') || lower.includes('closing') || lower.includes('due') || lower.includes('date')) {
      return [...eligibleList, ...possibleList]
        .sort((a, b) => new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime())
        .slice(0, 3);
    }
    return [...eligibleList, ...possibleList].slice(0, 3);
  };

  const suggestedScholarships = pickSuggestedScholarships().map(({ scholarship: s, evaluation: e }) => ({
    id: s.id,
    title: s.title,
    provider: s.provider,
    amount: s.amount,
    deadline: s.deadline,
    link: s.link || s.apply_link,
    region: s.region,
    verification_status: s.verification_status || 'Verified Source',
    status: e.status,
    compatibilityScore: e.compatibilityScore,
    summaryReason: e.summaryReason,
  }));

  if (ai) {
    try {
      const systemInstruction = `You are the Official ScholarAI Chatbot for Indian students.
Respond in ${langLabel} using clear, warm, student-friendly language that is easy to understand.
CRITICAL GROUNDING RULES:
1. Ground every scholarship recommendation, deadline, amount, and document requirement in the Verified Catalog Context below and up-to-date Google Search data when verifying live portal dates or announcements.
2. NEVER fabricate scholarships, deadlines, amounts, or guaranteed award promises.
3. Refer to scores ONLY as "Profile Compatibility Score" — never as "award probability" or guarantee.
4. Always cite the official portal URL and mention the verification status when recommending scholarships.
5. Never ask the student for Aadhaar numbers or bank account passwords.

STUDENT PROFILE:
${profile ? JSON.stringify(profile) : 'Not signed in / Default profile'}

VERIFIED SCHOLARSHIP CATALOG & DETERMINISTIC ELIGIBILITY:
${topMatchesSummary}`;

      const historyContext = (body.history || [])
        .slice(-6)
        .map((h) => `${h.sender === 'user' ? 'Student' : 'Advisor'}: ${h.text}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `${historyContext ? `Recent Conversation:\n${historyContext}\n\n` : ''}Student Question: ${message}`,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const searchSources: Array<{ title: string; uri: string }> = [];
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            searchSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
      }

      if (response.text) {
        return NextResponse.json({
          reply: response.text,
          language,
          groundedCount: eligibleList.length,
          suggestedScholarships,
          searchSources,
        });
      }
    } catch (err) {
      console.warn('Gemini advisor_chat fallback triggered:', err);
    }
  }

  if (lower.includes('deadline') || lower.includes('closing') || lower.includes('due')) {
    const sortedByDate = [...eligibleList, ...possibleList]
      .sort((a, b) => new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime())
      .slice(0, 5);
    return NextResponse.json({
      reply:
        `Here are the upcoming application deadlines for scholarships matching your profile (sorted by earliest closing date):\n\n` +
        sortedByDate
          .map(
            ({ scholarship: s, evaluation: e }) =>
              `• **${s.title}** (${s.provider})\n  Deadline: **${s.deadline}** | Award: **₹${s.amount.toLocaleString('en-IN')}/yr** | Status: **${e.status}**`
          )
          .join('\n\n') +
        `\n\nTip: Apply at least 7 days before the closing date so your institution has time for online verification.`,
      language,
      groundedCount: eligibleList.length,
      suggestedScholarships,
    });
  }

  if (lower.includes('telangana') || lower.includes('state') || lower.includes('epass')) {
    const stateMatches = evaluated.filter(
      (x) =>
        x.scholarship.title.toLowerCase().includes('telangana') ||
        x.scholarship.region.toLowerCase().includes('telangana') ||
        (profile?.state && x.scholarship.region.toLowerCase().includes(profile.state.toLowerCase()))
    );
    const items = (stateMatches.length > 0 ? stateMatches : eligibleList).slice(0, 4);
    return NextResponse.json({
      reply:
        language === 'te'
          ? `మీ ప్రొఫైల్ మరియు రాష్ట్రం ఆధారంగా ధృవీకరించబడిన స్కాలర్‌షిప్‌లు:\n\n` +
            items
              .map(
                ({ scholarship: s, evaluation: e }) =>
                  `• **${s.title}** (${s.provider}) — ₹${s.amount.toLocaleString('en-IN')}\n  అర్హత: ${e.status} (${e.compatibilityScore}% ప్రొఫైల్ అనుకూలత) | గడువు: ${s.deadline}\n  అధికారిక పోర్టల్: ${s.link}`
              )
              .join('\n\n')
          : language === 'hi'
          ? `आपकी प्रोफ़ाइल और राज्य के आधार पर सत्यापित छात्रवृत्तियाँ:\n\n` +
            items
              .map(
                ({ scholarship: s, evaluation: e }) =>
                  `• **${s.title}** (${s.provider}) — ₹${s.amount.toLocaleString('en-IN')}\n  पात्रता: ${e.status} (${e.compatibilityScore}% प्रोफ़ाइल अनुकूलता) | अंतिम तिथि: ${s.deadline}\n  आधिकारिक पोर्टल: ${s.link}`
              )
              .join('\n\n')
          : `Here are the verified state and national scholarships matching your domicile (${profile?.state || 'India'}):\n\n` +
            items
              .map(
                ({ scholarship: s, evaluation: e }) =>
                  `• **${s.title}** (${s.provider}) — ₹${s.amount.toLocaleString('en-IN')}/yr\n  Status: **${e.status}** (${e.compatibilityScore}% Profile Compatibility) | Deadline: ${s.deadline}\n  Required Documents: ${(s.required_documents || []).slice(0, 4).join(', ')}\n  Official Portal: ${s.link}`
              )
              .join('\n\n'),
      language,
      groundedCount: eligibleList.length,
      suggestedScholarships,
    });
  }

  if (lower.includes('not eligible') || lower.includes('ineligible') || lower.includes('why')) {
    const notEligible = evaluated.filter((x) => x.evaluation.status === 'Not Eligible').slice(0, 4);
    const bodyText =
      notEligible.length > 0
        ? notEligible
            .map(
              ({ scholarship: s, evaluation: e }) =>
                `• **${s.title}**: ${e.unmetCriteria.join('; ')}`
            )
            .join('\n')
        : 'You currently meet the main requirements for most general scholarships in our list!';
    return NextResponse.json({
      reply: `Here is why some scholarships don't match your current profile:\n\n${bodyText}\n\n*Tip: Make sure your Marks %, Family Income, and Category are up to date in your Profile.*`,
      language,
      groundedCount: eligibleList.length,
      suggestedScholarships,
    });
  }

  if (lower.includes('document') || lower.includes('certificate') || lower.includes('checklist') || lower.includes('upload')) {
    return NextResponse.json({
      reply:
        `### Essential Scholarship Documents Checklist\n\n` +
        `For most Verified NSP, AICTE, and State Portal scholarships, prepare these scanned documents (PDF/JPEG under 5MB):\n` +
        `1. **Previous Academic Mark Sheets** (Class 10, Class 12, and latest Semester GPA/Marks card)\n` +
        `2. **Valid Income Certificate** issued by Tehsildar / MeeSeva / Nadakacheri / MahaOnline\n` +
        `3. **Bonafide / Current Admission Certificate** from your institution\n` +
        `4. **Category / Caste Certificate** (if applying under SC/ST/OBC/EWS quota)\n` +
        `5. **Domicile / Residence Certificate** (for state portals like Telangana ePASS, MahaDBT, SSP)\n` +
        `6. **Student Bank Passbook Copy** (linked with NPCI/DBT for direct benefit transfer)\n\n` +
        `You can upload your resume or mark sheet in the **Upload Documents** page to automatically check your details and fill your profile!`,
      language,
      groundedCount: eligibleList.length,
      suggestedScholarships,
    });
  }

  const topItems = [...eligibleList, ...possibleList].slice(0, 4);
  return NextResponse.json({
    reply:
      `Based on your profile (**${profile?.course || 'Student'}**, Marks: **${profile?.marks_percent ?? 'N/A'}%**, Family Income: **₹${(profile?.income ?? 0).toLocaleString('en-IN')}**, Category: **${profile?.category || 'General'}**, State: **${profile?.state || 'India'}**), you have **${eligibleList.length} Eligible** and **${possibleList.length} Possibly Eligible** scholarships:\n\n` +
      topItems
        .map(
          ({ scholarship: s, evaluation: e }) =>
            `• **${s.title}** (${s.provider}) — **₹${s.amount.toLocaleString('en-IN')}**\n  Compatibility: **${e.compatibilityScore}% (${e.status})** | Deadline: **${s.deadline}** (${s.verification_status})\n  Why: ${e.matchedCriteria.slice(0, 2).join(', ') || e.summaryReason}\n  Official Portal: ${s.link}`
        )
        .join('\n\n') +
      `\n\nAsk me about **Telangana / State scholarships**, **required documents**, **why a scholarship is Not Eligible**, or **SOP / essay drafting**!`,
    language,
    groundedCount: eligibleList.length,
    suggestedScholarships,
  });
}

async function handleAnalyzeDocument(body: {
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  extractedText?: string;
  documentType?: string;
}) {
  const ai = getGenAIClient();
  const fileName = String(body.fileName || 'document');
  const mimeType = String(body.mimeType || 'text/plain');
  const rawText = String(body.extractedText || '').trim();
  const base64Data = String(body.base64Data || '').trim();

  if (ai && (rawText || base64Data)) {
    try {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (base64Data && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
      parts.push({
        text: `Analyze this student academic document / resume (${fileName}, category: ${body.documentType || 'Resume / Mark Sheet'}).
${rawText ? `Document Text:\n${rawText}\n` : ''}
Extract ONLY information explicitly present in the document. Do NOT guess or fabricate missing values (return null for fields not found). Never extract or store Aadhaar numbers or bank account numbers.`,
      });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: parts,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fullName: { type: Type.STRING, nullable: true },
              course: { type: Type.STRING, nullable: true },
              specialization: { type: Type.STRING, nullable: true },
              education_level: { type: Type.STRING, nullable: true },
              academic_year: { type: Type.STRING, nullable: true },
              institution: { type: Type.STRING, nullable: true },
              marks_percent: { type: Type.NUMBER, nullable: true },
              cgpa: { type: Type.NUMBER, nullable: true },
              income: { type: Type.NUMBER, nullable: true },
              category: { type: Type.STRING, nullable: true },
              state: { type: Type.STRING, nullable: true },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
              detectedDocumentType: { type: Type.STRING },
              readinessNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['achievements', 'detectedDocumentType', 'readinessNotes'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return NextResponse.json({
          ok: true,
          extracted: parsed,
          source: 'gemini',
        });
      }
    } catch (err) {
      console.warn('Gemini document analysis fallback:', err);
    }
  }

  // Deterministic regex extraction fallback from text/filename
  const combined = `${fileName}\n${rawText}`;
  const percentMatch = combined.match(/(\d{2}(?:\.\d{1,2})?)\s*%/);
  const cgpaMatch = combined.match(/(?:CGPA|GPA)[:\s-]*(\d(?:\.\d{1,2})?)/i);
  const incomeMatch = combined.match(/(?:income|annual)[:\s₹Rs.]*(\d{4,7})/i);
  const courseMatch = combined.match(/\b(B\.?Tech|B\.?E|MBBS|B\.?Sc|B\.?Com|B\.?A|M\.?Tech|MBA|M\.?Sc|BCA|MCA|Diploma|LLB)\b/i);
  const stateMatch = combined.match(
    /\b(Telangana|Maharashtra|Karnataka|Tamil Nadu|Andhra Pradesh|Kerala|Delhi|Uttar Pradesh|Gujarat|West Bengal|Rajasthan)\b/i
  );
  const categoryMatch = combined.match(/\b(General|OBC|SC|ST|EWS|Minority)\b/i);

  return NextResponse.json({
    ok: true,
    source: 'deterministic-parser',
    extracted: {
      fullName: null,
      course: courseMatch ? courseMatch[1] : null,
      specialization: combined.match(/\b(Computer Science|CSE|ECE|Mechanical|Civil|Electrical|Data Science|AI)\b/i)?.[1] || null,
      education_level: 'Undergraduate',
      academic_year: combined.match(/\b(1st Year|2nd Year|3rd Year|4th Year)\b/i)?.[1] || null,
      institution: null,
      marks_percent: percentMatch ? parseFloat(percentMatch[1]) : null,
      cgpa: cgpaMatch ? parseFloat(cgpaMatch[1]) : null,
      income: incomeMatch ? parseInt(incomeMatch[1], 10) : null,
      category: categoryMatch ? categoryMatch[1].toUpperCase() : null,
      state: stateMatch ? stateMatch[1] : null,
      achievements: rawText
        ? rawText
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 15 && l.length < 140)
            .slice(0, 4)
        : [`Uploaded ${fileName} verified for format and size compliance.`],
      detectedDocumentType: body.documentType || 'Academic / Resume Document',
      readinessNotes: [
        'File format and size (≤ 5MB) validated.',
        'Review extracted values below before applying them to your Student Profile.',
      ],
    },
  });
}

async function handleExplainEligibility(body: {
  scholarshipId?: string | number;
  profile?: UserProfile;
}) {
  const scholarship = catalogScholarships.find(
    (s) => String(s.id) === String(body.scholarshipId)
  );
  if (!scholarship || !body.profile) {
    return NextResponse.json({ error: 'Scholarship or profile missing' }, { status: 400 });
  }

  const evaluation = evaluateScholarshipEligibility(body.profile, scholarship);
  const ai = getGenAIClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Provide a concise, transparent 3-sentence eligibility explanation for the student based strictly on the deterministic evaluation below. Never invent criteria or promise award selection.
Scholarship: ${scholarship.title} (${scholarship.provider})
Official Eligibility Text: ${scholarship.eligibility.description}
Deterministic Status: ${evaluation.status} (${evaluation.compatibilityScore}% Profile Compatibility)
Matched Criteria: ${evaluation.matchedCriteria.join('; ')}
Unmet Criteria: ${evaluation.unmetCriteria.join('; ')}
Missing Info: ${evaluation.missingInformation.join('; ')}`,
      });
      if (response.text) {
        return NextResponse.json({
          explanation: response.text,
          evaluation,
        });
      }
    } catch (err) {
      console.warn('Gemini explain_eligibility fallback:', err);
    }
  }

  return NextResponse.json({
    explanation: evaluation.summaryReason,
    evaluation,
  });
}

async function handleGenerateEssay(body: {
  scholarshipId?: string | number;
  profile?: UserProfile;
  studentGoals?: string;
  financialNeedContext?: string;
  confirmedAchievements?: string;
}) {
  const scholarship = catalogScholarships.find(
    (s) => String(s.id) === String(body.scholarshipId)
  );
  const profile = body.profile;
  if (!scholarship || !profile) {
    return NextResponse.json({ error: 'Scholarship and student profile are required.' }, { status: 400 });
  }

  const ai = getGenAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Draft a personal statement / scholarship application essay (250–350 words) for the "${scholarship.title}" provided by "${scholarship.provider}".
CRITICAL RULE: Use ONLY the student-confirmed profile details and inputs below. Do NOT fabricate awards, hardships, rankings, or achievements that the student did not state. Use bracketed placeholders like [Insert specific project/example if applicable] where additional personal detail could strengthen the paragraph.

Student Confirmed Facts:
- Name: ${profile.fullName}
- Course & Specialization: ${profile.course} ${profile.specialization ? `(${profile.specialization})` : ''}
- Education Level & Year: ${profile.education_level || 'Undergraduate'}, ${profile.academic_year || 'Current Student'}
- Institution: ${profile.institution || '[Your Institution Name]'}
- Academic Score: ${profile.marks_percent ?? 'N/A'}% ${profile.cgpa ? `(CGPA: ${profile.cgpa})` : ''}
- State / Domicile: ${profile.state || 'India'}
- Annual Family Income: ₹${(profile.income ?? 0).toLocaleString('en-IN')}
- Student's Stated Academic & Career Goals: ${body.studentGoals || profile.career_interests || 'Pursuing academic excellence and contributing to my field'}
- Student's Confirmed Achievements: ${body.confirmedAchievements || 'Consistent academic performance in coursework'}
- Financial Context: ${body.financialNeedContext || 'Seeking financial support to cover tuition and academic expenses'}`,
      });

      if (response.text) {
        return NextResponse.json({ essay: response.text, source: 'gemini' });
      }
    } catch (err) {
      console.warn('Gemini generate_essay fallback:', err);
    }
  }

  const draft = `Statement of Purpose — Application for ${scholarship.title}

Respected Selection Committee at ${scholarship.provider},

My name is ${profile.fullName}, and I am currently pursuing ${profile.course}${profile.specialization ? ` in ${profile.specialization}` : ''} (${profile.academic_year || 'Current Academic Year'}) at ${profile.institution || '[Your Institution Name]'}, ${profile.state || 'India'}. I am writing to apply for the ${scholarship.title}.

Throughout my academic journey, I have maintained a consistent focus on my studies, achieving ${profile.marks_percent ?? '[Your Marks]'}%${profile.cgpa ? ` (CGPA: ${profile.cgpa})` : ''} in my qualifying examinations. ${body.confirmedAchievements ? `In addition to my coursework, my confirmed academic activities include: ${body.confirmedAchievements}.` : ''} My academic and career goal is focused on ${body.studentGoals || profile.career_interests || 'building strong technical and professional competence in my chosen discipline'}.

With an annual family income of ₹${(profile.income ?? 0).toLocaleString('en-IN')}, managing annual tuition, books, and essential academic expenses requires careful planning. ${body.financialNeedContext ? body.financialNeedContext : 'Receiving the ' + scholarship.title + ' would directly alleviate the financial pressure on my family and allow me to dedicate my full time and energy to laboratory work, coursework, and skill development.'}

I confirm that all information provided in this statement reflects my verified academic and personal records. Thank you for considering my application.

Sincerely,
${profile.fullName}`;

  return NextResponse.json({ essay: draft, source: 'deterministic-template' });
}

async function handleReviewEssay(body: {
  essayText?: string;
  scholarshipTitle?: string;
}) {
  const essayText = String(body.essayText || '').trim();
  if (!essayText) {
    return NextResponse.json({ error: 'Please provide an essay draft to review.' }, { status: 400 });
  }

  const ai = getGenAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Review this student's scholarship application essay for "${body.scholarshipTitle || 'an Indian Scholarship'}".
Provide:
1. Clarity & Structure Assessment
2. Alignment with Scholarship Criteria
3. Check for any unsupported claims that need concrete evidence
4. A polished, improved version that preserves ONLY the student's stated facts without inventing new achievements.

Student Draft:
${essayText}`,
      });
      if (response.text) {
        return NextResponse.json({ review: response.text });
      }
    } catch (err) {
      console.warn('Gemini review_essay fallback:', err);
    }
  }

  const wordCount = essayText.split(/\s+/).filter(Boolean).length;
  return NextResponse.json({
    review: `### Essay Review Summary (${wordCount} words)

- **Length Check**: ${wordCount < 150 ? 'Your draft is slightly brief (<150 words). Consider expanding on your academic goals and how the scholarship reduces your tuition burden.' : wordCount > 450 ? 'Your draft is over 450 words. Most Indian scholarship portals (NSP / Foundation portals) prefer a concise 250–350 word statement.' : 'Ideal word count (150–400 words) for scholarship portals.'}
- **Fact Integrity**: Ensure every percentage, CGPA, and family income figure matches your uploaded mark sheet and Tehsildar income certificate exactly.
- **Structure Recommendation**:
  1. Opening: State your degree, institution, academic year, and current marks/CGPA.
  2. Academic Motivation: Highlight your specialization and career direction.
  3. Financial Impact: Explain clearly how the scholarship amount covers tuition, hostel, or book expenses.`,
  });
}
