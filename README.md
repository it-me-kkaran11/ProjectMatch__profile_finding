# ProjectMatch__profile_finding

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-u82m1lrv)

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in the project URL and anon key.
3. Apply both SQL migrations in `supabase/migrations/` using the Supabase SQL editor or CLI.
4. Run `npm install` and `npm run dev`.

The application will show a configuration screen instead of a blank page when the Supabase variables are missing. Authenticated profile discovery requires the final profile-discovery migration.
