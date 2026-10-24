ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.officials TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active officials" ON public.officials;
CREATE POLICY "Public can read active officials"
  ON public.officials
  FOR SELECT
  TO anon, authenticated
  USING (is_active IS TRUE);
