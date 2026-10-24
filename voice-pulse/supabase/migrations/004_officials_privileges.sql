ALTER TABLE public.officials ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.officials FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.officials TO anon, authenticated;
