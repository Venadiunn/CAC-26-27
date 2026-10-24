# Supabase setup

## Apply the schema

In the Supabase Dashboard, open **SQL Editor** and apply the checked-in migrations in order:

1. `migrations/001_init.sql`
2. `migrations/002_officials_read_policy.sql`
3. `migrations/003_user_saved_data.sql`
4. `migrations/004_officials_privileges.sql`

The repository does not currently include Supabase CLI project configuration, and these migrations have not been applied or verified against the live project. Applying SQL is a manual Dashboard step unless a CLI project is configured later.

The user tables use RLS and `auth.uid()` ownership checks. Officials are publicly selectable only while active; mobile clients receive no write privileges.

## Configure Expo

Keep only these client values in `voice-pulse/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
EXPO_PUBLIC_USE_SEED_DATA=true
```

Use the Supabase publishable key, not a database connection URL, service-role key, or secret API key. Restart Expo after environment changes. Seed mode is the default; change `EXPO_PUBLIC_USE_SEED_DATA=false` only after applying the schema and inserting reviewed records into `public.officials`.

## Populate officials

Import only verified official records into `public.officials`, using the columns defined in `migrations/001_init.sql`: `id`, `full_name`, `office_title`, `jurisdiction`, `level`, `email`, `phone`, `source_url`, `last_verified_on`, `verification_notes`, and `is_active`. Use a UUID for `id` and one of `city`, `county`, `state`, or `federal` for `level`, matching the app type. Keep `source_url` and `last_verified_on` current. Do not upload staff rosters or student/member data.

## Rotate the exposed database password

A PostgreSQL connection credential was exposed outside the project. In the Dashboard, rotate/reset the database password under **Project Settings → Database**, then update any legitimate server-only database clients that use it. Do not put the replacement connection URL into Expo variables or the mobile app. The app uses the Supabase HTTPS API with the project URL and publishable key instead.
