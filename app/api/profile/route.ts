import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

const relatedUserTables = [
  'audits',
  'keyword_tracks',
  'manual_payments',
  'scan_sessions',
] as const

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid session. Please log in again.' }, { status: 401 })
    }

    const userId = authData.user.id
    const cleanupErrors: string[] = []

    for (const table of relatedUserTables) {
      const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
      if (error) cleanupErrors.push(`${table}: ${error.message}`)
    }

    const { data: avatarFiles } = await supabaseAdmin.storage
      .from('profile-avatars')
      .list(userId)

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map(file => `${userId}/${file.name}`)
      const { error: storageError } = await supabaseAdmin.storage
        .from('profile-avatars')
        .remove(filePaths)

      if (storageError) cleanupErrors.push(`profile-avatars: ${storageError.message}`)
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) cleanupErrors.push(`profiles: ${profileError.message}`)

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      warnings: cleanupErrors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not delete account' },
      { status: 500 },
    )
  }
}
