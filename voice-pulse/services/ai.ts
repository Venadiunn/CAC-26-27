import type { Article, AskCompanionResponse, GenerateAdvocacyResponse } from '../types';
import type { IssueRecord } from './issues';

export type ArticleSummary = {
  title: string;
  overview: string;
  bullets: string[];
  caution: string;
};

type GroundingContext = Article | IssueRecord;

declare const process: { env?: Record<string, string | undefined> } | undefined;

function isSeedMode(): boolean {
  return typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_USE_SEED_DATA === 'true';
}

function getLiveAiUrl(): string | null {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AI_API_URL) {
    return process.env.EXPO_PUBLIC_AI_API_URL;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/ai`;
  }

  return null;
}

async function callLiveAi<T>(payload: Record<string, unknown>): Promise<T> {
  const apiUrl = getLiveAiUrl();
  if (!apiUrl || isSeedMode()) {
    throw new Error('Live AI is disabled');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'AI request failed');
  }

  return data as T;
}

function isIssueContext(value?: GroundingContext): value is IssueRecord {
  return !!value && 'category' in value && 'policyQuestions' in value;
}

function buildContextSummary(context?: GroundingContext): string {
  if (!context) {
    return 'General Missouri civic context.';
  }

  if (isIssueContext(context)) {
    return `Issue context: ${context.title}. Category: ${context.category}. Summary: ${context.summary}. Government levels: ${context.governmentLevels.join(', ') || 'not specified in the current catalog'}.`;
  }

  return `Article context: ${context.title}. Topic tags: ${context.tags.join(', ')}. Source: ${context.sourceName}.`;
}

export async function generateArticleSummary(article: Article): Promise<ArticleSummary> {
  const subjectLine = article.tags.join(', ');

  if (getLiveAiUrl() && !isSeedMode()) {
    try {
      const result = await callLiveAi<{ title: string; overview: string; bullets: string[]; caution: string }>({
        kind: 'summarize_article',
        article,
      });

      return result;
    } catch {
      // Fall through to the local seed summary if the live endpoint is unreachable.
    }
  }

  const topicLine = article.tags.join(', ');

  return {
    title: article.title,
    overview:
      'This demo summary is AI-generated and intended for educational use. It is not an official reporting summary and should be checked against the original source before being treated as a factual statement.',
    bullets: [
      `What happened: ${article.excerpt}`,
      `Why it matters: The issue touches ${topicLine}, which affects students, families, and local decision-makers.`,
      `Who is affected: community members, school leaders, and public officials in ${article.jurisdictions.join(', ')}.`,
      'What remains uncertain: the exact policy outcome depends on action by local, state, or federal offices.',
    ],
    caution:
      'Use this summary as a guide to understanding the issue, not as a replacement for the underlying source material.',
  };
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
        : [{ title: 'Missouri civic guide', url: 'https://example.com/civic-guide' }],
      cached: true,
    };
  }

  if (getLiveAiUrl() && !isSeedMode()) {
    try {
      const response = await callLiveAi<AskCompanionResponse>({
        kind: 'ask_companion',
        question: normalizedQuestion,
        context,
      });

      if (response?.answer) {
        return response;
      }
    } catch {
      // Fall through to the local seed explanation when the live endpoint is unavailable.
    }
  }

  const issueContext = isIssueContext(context) ? context : null;
  const issueContextBlock = issueContext
    ? `Issue framing: ${issueContext.title}. Category: ${issueContext.category}. The issue is described as: ${issueContext.summary}. Relevant government levels: ${issueContext.governmentLevels.join(', ') || 'not specified'}.`
    : buildContextSummary(context);

  const answer = issueContext
    ? `${issueContextBlock} This answer is explanatory context rather than a verified legal or agency determination. It should be checked against the source list provided below and the relevant Missouri government materials for any final or procedural claim. A fair civic response should note the policy question, the decision-makers involved, and what evidence is missing or still uncertain.`
    : `${buildContextSummary(context)} This answer is general background information and should be paired with official source material before relying on it for a legal, budgetary, or procedural claim.`;

  const citations = issueContext
    ? issueContext.sources.map((source) => ({ title: source.name, url: source.url }))
    : context && 'sourceUrl' in context
      ? [{ title: context.title, url: context.sourceUrl }]
      : [{ title: 'Missouri state government overview', url: 'https://www.mo.gov/' }];

  return {
    answer: `${answer} User question: ${normalizedQuestion}`,
    grounding: 'interpretation',
    citations,
    cached: true,
  };
}

export async function generateAdvocacyDraft({
  articleId,
  officialId,
  userNotes,
  issueTitle,
}: {
  articleId: string;
  officialId: string;
  userNotes?: string;
  issueTitle?: string;
}): Promise<GenerateAdvocacyResponse> {
  if (getLiveAiUrl() && !isSeedMode()) {
    try {
      const response = await callLiveAi<GenerateAdvocacyResponse>({
        kind: 'generate_advocacy_draft',
        articleId,
        officialId,
        userNotes,
        issueTitle,
      });

      if (response?.body) {
        return response;
      }
    } catch {
      // Fall back to the local draft generator when the live endpoint is unavailable.
    }
  }

  const subject = issueTitle ? `Student perspective on ${issueTitle}` : `Student perspective on ${articleId.replace(/-/g, ' ')}`;
  const body = [
    'Dear [Official Name],',
    '',
    'I am writing to share a student perspective on a civic issue that affects my community and future opportunities.',
    userNotes ||
      'I believe public officials should make decisions that are transparent, responsive, and centered on the needs of residents and students.',
    '',
    'I am asking for attention to this issue, a clear explanation of next steps, and information about how community members can participate in the process.',
    '',
    'Thank you for your time and service. I appreciate your attention to this matter.',
    '',
    'Sincerely,',
    'VOICE Pulse user',
  ].join('\n');

  return {
    subject,
    body,
    grounding: 'interpretation',
    cached: true,
  };
}
