CREATE TABLE IF NOT EXISTS public.saved_issues (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, issue_id)
);

ALTER TABLE public.saved_issues ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saved_issues FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.saved_issues TO authenticated;

DROP POLICY IF EXISTS "Users can read their saved issues" ON public.saved_issues;
CREATE POLICY "Users can read their saved issues"
  ON public.saved_issues FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save their own issues" ON public.saved_issues;
CREATE POLICY "Users can save their own issues"
  ON public.saved_issues FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own issues" ON public.saved_issues;
CREATE POLICY "Users can remove their own issues"
  ON public.saved_issues FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.advocacy_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  issue_id text,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS advocacy_drafts_user_id_idx
  ON public.advocacy_drafts (user_id);

ALTER TABLE public.advocacy_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.advocacy_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.advocacy_drafts TO authenticated;

DROP POLICY IF EXISTS "Users can read their own drafts" ON public.advocacy_drafts;
CREATE POLICY "Users can read their own drafts"
  ON public.advocacy_drafts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own drafts" ON public.advocacy_drafts;
CREATE POLICY "Users can create their own drafts"
  ON public.advocacy_drafts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own drafts" ON public.advocacy_drafts;
CREATE POLICY "Users can update their own drafts"
  ON public.advocacy_drafts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own drafts" ON public.advocacy_drafts;
CREATE POLICY "Users can delete their own drafts"
  ON public.advocacy_drafts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
