export type Article = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  canonicalUrl: string;
  publishedAt: string;
  excerpt: string;
  jurisdictions: string[];
  tags: string[];
};

export type Official = {
  id: string;
  fullName: string;
  officeTitle: string;
  jurisdiction: string;
  level: 'city' | 'county' | 'state' | 'federal';
  email: string;
  phone?: string;
  sourceUrl: string;
  lastVerifiedOn?: string;
};

export type AskCompanionRequest = {
  articleId: string;
  question: string;
};

export type AskCompanionResponse = {
  answer: string;
  grounding: 'verified' | 'interpretation' | 'model_knowledge';
  citations: { title: string; url: string }[];
  cached?: boolean;
  error?: string;
};

export type GenerateAdvocacyRequest = {
  articleId: string;
  officialId: string;
  userNotes?: string;
};

export type GenerateAdvocacyResponse = {
  subject: string;
  body: string;
  grounding: 'verified' | 'interpretation' | 'model_knowledge';
  cached?: boolean;
  error?: string;
};
