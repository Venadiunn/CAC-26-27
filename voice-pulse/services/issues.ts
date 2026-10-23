import { issueCatalog, issueCategories } from '../data/issues-data.js';

export type IssueSource = {
  name: string;
  url: string;
};

export type IssueRecord = {
  id: string;
  title: string;
  category: string;
  summary: string;
  subtopics: string[];
  keywords: string[];
  governmentLevels: string[];
  affectedGroups: string[];
  policyQuestions: string[];
  sources: IssueSource[];
  relatedIssues: string[];
  lastVerified: string;
};

export const issueRecords: IssueRecord[] = issueCatalog as IssueRecord[];
export const ISSUE_CATEGORIES = issueCategories;

export function getIssueById(id: string): IssueRecord | undefined {
  return issueRecords.find((issue) => issue.id === id);
}

export function getIssuesByCategory(category: string): IssueRecord[] {
  return issueRecords.filter((issue) => issue.category === category);
}

export function normalizeIssueText(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + cost,
      );
    }
  }

  return rows[a.length][b.length];
}

function matchesNormalizedText(sourceText: string, query: string): boolean {
  const normalizedSource = normalizeIssueText(sourceText);
  const normalizedQuery = normalizeIssueText(query);

  if (!normalizedQuery) {
    return true;
  }

  if (normalizedSource.includes(normalizedQuery)) {
    return true;
  }

  const terms = normalizedQuery.split(' ').filter(Boolean);
  return terms.some((term) => {
    if (!term) {
      return false;
    }

    if (term.length <= 2) {
      return normalizedSource.includes(term);
    }

    const sourceTerms = normalizedSource.split(' ');
    return sourceTerms.some((sourceTerm) => {
      if (sourceTerm.length < term.length - 1) {
        return false;
      }

      return levenshteinDistance(sourceTerm, term) <= 1;
    });
  });
}

export function searchIssues(query: string, filters: { category?: string; governmentLevel?: string; subtopic?: string; affectedGroup?: string } = {}) {
  const normalizedQuery = normalizeIssueText(query);

  const filtered = issueRecords.filter((issue) => {
    if (filters.category && issue.category !== filters.category) {
      return false;
    }

    if (filters.governmentLevel && !issue.governmentLevels.some((level) => level.toLowerCase().includes(filters.governmentLevel!.toLowerCase()))) {
      return false;
    }

    if (filters.subtopic && !issue.subtopics.some((topic) => matchesNormalizedText(topic, filters.subtopic!))) {
      return false;
    }

    if (filters.affectedGroup && !issue.affectedGroups.some((group) => matchesNormalizedText(group, filters.affectedGroup!))) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = [
      issue.title,
      issue.summary,
      issue.category,
      ...issue.keywords,
      ...issue.subtopics,
      ...issue.affectedGroups,
      ...issue.policyQuestions,
    ].join(' ');

    return matchesNormalizedText(searchText, normalizedQuery);
  });

  if (!normalizedQuery) {
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  return filtered.sort((a, b) => {
    const aText = [a.title, a.summary, ...a.keywords, ...a.subtopics].join(' ');
    const bText = [b.title, b.summary, ...b.keywords, ...b.subtopics].join(' ');
    const aScore = aText.toLowerCase().includes(normalizedQuery) ? 2 : 0;
    const bScore = bText.toLowerCase().includes(normalizedQuery) ? 2 : 0;

    return bScore - aScore || a.title.localeCompare(b.title);
  });
}
