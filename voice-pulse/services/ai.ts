import type { Article, AskCompanionResponse, GenerateAdvocacyResponse } from '../types';
import type { IssueRecord } from './issues';

export type ArticleSummary = {
  title: string;
  overview: string;
  bullets: string[];
  caution: string;
};

type GroundingContext = Article | IssueRecord;

export type IssueExplanation = {
  sections: { title: string; content: string }[];
  caution: string;
  grounding: 'interpretation';
  cached: boolean;
};

declare const process: { env?: Record<string, string | undefined> } | undefined;

function getLiveAiUrl(): string | null {
  const configuredUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_AI_API_URL?.trim() : '';
  if (configuredUrl) {
    return configuredUrl.endsWith('/api/ai') ? configuredUrl : `${configuredUrl.replace(/\/$/, '')}/api/ai`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api/ai';
    }
    return `${window.location.origin}/api/ai`;
  }

  return null;
}

async function callLiveAi<T>(payload: Record<string, unknown>): Promise<T> {
  const apiUrl = getLiveAiUrl();
  if (!apiUrl) {
    throw new Error('AI is not configured. Set EXPO_PUBLIC_AI_API_URL to the server-side AI route.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The AI request took too long. Please try again.');
    }
    throw new Error('The AI service is unavailable. Check the server route and try again.');
  } finally {
    clearTimeout(timeout);
  }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('The AI route returned a non-JSON response. Expo Metro does not serve API routes; start the Vercel API locally and set EXPO_PUBLIC_AI_API_URL.');
    }

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      throw new Error('The AI route returned an invalid response. Please retry.');
    }

  if (!response.ok) {
    throw new Error(data?.error || 'AI request failed');
  }

  return data as T;
}

export async function generateArticleSummary(article: Article): Promise<ArticleSummary> {
  const data = await callLiveAi<ArticleSummary>({
    kind: 'summarize_article',
    article,
  });

  return data;
}

export async function explainIssue(issue: IssueRecord, question = ''): Promise<IssueExplanation> {
  const response = await callLiveAi<IssueExplanation>({
    kind: 'explain_issue',
    issue: {
      title: issue.title,
      category: issue.category,
      summary: issue.summary,
      governmentLevels: issue.governmentLevels,
      policyQuestions: issue.policyQuestions,
      sources: issue.sources,
    },
    question: question.trim(),
  });

  if (!Array.isArray(response.sections) || response.sections.length === 0 || response.sections.some((section) => !section.title || !section.content)) {
    throw new Error('The AI response was incomplete. Please retry.');
  }
  return response;
}

export async function askCompanion(
  question: string,
  context?: GroundingContext,
): Promise<AskCompanionResponse> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    return {
      answer: 'Ask a civic question about Missouri government, legislation, or local issues and I can help explain it in plain language.',
      grounding: 'interpretation',
      citations: context && 'sourceUrl' in context
        ? [{ title: context.title, url: context.sourceUrl }]
        : [{ title: 'Missouri state government overview', url: 'https://www.mo.gov/' }],
      cached: true,
    };
  }

  return callLiveAi<AskCompanionResponse>({
    kind: 'ask_companion',
    question: normalizedQuestion,
    context,
  });
}

export async function generateAdvocacyDraft({
  articleId,
  officialId,
  userNotes,
  issueTitle,
  issueSummary,
  personalPerspective,
  requestedAction,
  tone,
  officialName,
  officialOffice,
  officialJurisdiction,
}: {
  articleId: string;
  officialId: string;
  userNotes?: string;
  issueTitle?: string;
  issueSummary?: string;
  personalPerspective?: string;
  requestedAction?: string;
  tone?: 'professional' | 'persuasive' | 'concise' | 'community-focused';
  officialName?: string;
  officialOffice?: string;
  officialJurisdiction?: string;
}): Promise<GenerateAdvocacyResponse> {
  return callLiveAi<GenerateAdvocacyResponse>({
    kind: 'generate_advocacy_draft',
    articleId,
    officialId,
    userNotes,
    issueTitle,
    issueSummary,
    personalPerspective,
    requestedAction,
    tone: tone ?? 'professional',
    officialName,
    officialOffice,
    officialJurisdiction,
  });
}
