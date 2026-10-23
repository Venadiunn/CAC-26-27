import type { Article } from '../types';

export const demoNewsArticles: Article[] = [
  {
    id: 'education-funding',
    title: 'Missouri students and parents weigh in on school funding priorities',
    sourceName: 'Demo civic briefing',
    sourceUrl: 'https://example.com/demo/civic-briefing',
    canonicalUrl: 'https://example.com/demo/civic-briefing/education-funding',
    publishedAt: '2026-09-10T12:00:00.000Z',
    excerpt:
      'A discussion about classroom needs, transportation, and district-level resource planning is prompting questions about how state and local funding decisions reach students.',
    jurisdictions: ['Missouri', 'St. Charles County'],
    tags: ['Education', 'Youth issues', 'Missouri legislation'],
  },
  {
    id: 'mental-health',
    title: 'Mental health support in schools remains a top concern for students',
    sourceName: 'Demo civic briefing',
    sourceUrl: 'https://example.com/demo/civic-briefing/mental-health',
    canonicalUrl: 'https://example.com/demo/civic-briefing/mental-health',
    publishedAt: '2026-09-25T09:30:00.000Z',
    excerpt:
      'Parents, counselors, and students are emphasizing the need for more consistent counseling access, digital privacy safeguards, and staff training across campuses.',
    jurisdictions: ['Missouri'],
    tags: ['Mental health', 'Education', 'Youth issues'],
  },
  {
    id: 'ai-ethics',
    title: 'AI in classrooms raises questions about accountability and student privacy',
    sourceName: 'Demo civic briefing',
    sourceUrl: 'https://example.com/demo/civic-briefing/ai-ethics',
    canonicalUrl: 'https://example.com/demo/civic-briefing/ai-ethics',
    publishedAt: '2026-10-02T15:15:00.000Z',
    excerpt:
      'Local leaders are discussing how AI tools can support learning while preserving transparency, student agency, and reasonable safeguards for personal data.',
    jurisdictions: ['Missouri', 'Federal'],
    tags: ['Technology and AI', 'Education', 'Civil rights'],
  },
  {
    id: 'water-quality',
    title: 'Clean water and infrastructure remain a major issue for young Missourians',
    sourceName: 'Demo civic briefing',
    sourceUrl: 'https://example.com/demo/civic-briefing/water-quality',
    canonicalUrl: 'https://example.com/demo/civic-briefing/water-quality',
    publishedAt: '2026-10-05T10:00:00.000Z',
    excerpt:
      'Students and advocacy groups are looking at how local infrastructure, environmental protections, and public health investments intersect with community trust.',
    jurisdictions: ['Missouri', 'Local'],
    tags: ['Environment', 'Public health', 'Government'],
  },
];

export async function getNews(): Promise<Article[]> {
  return demoNewsArticles;
}

export async function getArticleById(id: string): Promise<Article | undefined> {
  return demoNewsArticles.find((article) => article.id === id);
}

export async function getArticlesByCategory(category: string): Promise<Article[]> {
  const normalized = category.toLowerCase();
  return demoNewsArticles.filter((article) =>
    article.tags.some((tag) => tag.toLowerCase().includes(normalized)),
  );
}
