# Supabase Auth Email Templates

## Forgot Password / Recovery

Template files:

- `supabase/templates/recovery.subject.txt`
- `supabase/templates/recovery.html`

This template is written for Supabase Auth email variables:

- `{{ .ConfirmationURL }}`: the secure recovery link
- `{{ .Email }}`: the user email address
- `{{ .SiteURL }}`: the configured Supabase site URL
- `{{ .Data.name }}`: optional user metadata name

## Apply With Script

Create a Supabase access token from Supabase Account > Access Tokens, then run:

```bash
SUPABASE_ACCESS_TOKEN="your-token" SUPABASE_PROJECT_REF="wkjltzijqoxszgcrvism" pnpm supabase:email:recovery
```

## Manual Apply

In Supabase Dashboard:

1. Go to Authentication > Emails.
2. Open the Reset Password / Recovery template.
3. Set the subject from `recovery.subject.txt`.
4. Paste the HTML from `recovery.html`.
5. Save.

Make sure Authentication > URL Configuration has the correct production Site URL so `{{ .SiteURL }}` points to your live app.
