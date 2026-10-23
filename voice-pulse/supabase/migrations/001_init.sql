CREATE TABLE IF NOT EXISTS news_sources (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  homepage_url text,
  rss_url text,
  jurisdiction text,
  license_notes text,
  is_enabled boolean DEFAULT true,
  last_fetched_at timestamptz
);

CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY,
  source_id uuid,
  title text NOT NULL,
  summary_plain text,
  body_excerpt text,
  canonical_url text UNIQUE,
  published_at timestamptz,
  jurisdictions text[],
  topic_tags text[],
  ingest_status text,
  raw_guid text
);

CREATE TABLE IF NOT EXISTS officials (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  office_title text,
  jurisdiction text,
  level text,
  email text,
  phone text,
  source_url text,
  last_verified_on date,
  verification_notes text,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS ai_cache (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  article_id uuid,
  prompt_hash text,
  model_id text,
  request_json jsonb,
  response_json jsonb,
  created_at timestamptz DEFAULT now()
);
