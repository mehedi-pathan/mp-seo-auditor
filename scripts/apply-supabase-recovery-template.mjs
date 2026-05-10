import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const accessToken = process.env.SUPABASE_ACCESS_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([^.]+)\.supabase\.co/)?.[1]

if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN. Create one from Supabase Account > Access Tokens.')
  process.exit(1)
}

if (!projectRef) {
  console.error('Missing SUPABASE_PROJECT_REF. Example: wkjltzijqoxszgcrvism')
  process.exit(1)
}

const root = process.cwd()
const html = await readFile(resolve(root, 'supabase/templates/recovery.html'), 'utf8')
const subject = (await readFile(resolve(root, 'supabase/templates/recovery.subject.txt'), 'utf8')).trim()

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mailer_subjects_recovery: subject,
    mailer_templates_recovery_content: html,
  }),
})

if (!response.ok) {
  const details = await response.text()
  console.error(`Failed to update Supabase recovery email template (${response.status}).`)
  console.error(details)
  process.exit(1)
}

console.log(`Updated Supabase recovery email template for project ${projectRef}.`)
