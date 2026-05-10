import { NextResponse } from 'next/server'
import { getAppUrl } from '@/lib/sslcommerz'

export async function POST() {
  return NextResponse.redirect(`${getAppUrl()}/upgrade?payment=canceled`, 303)
}
