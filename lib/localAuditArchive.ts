import type { AuditResult } from '@/types'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'

const archiveKey = 'mp-seo-auditor:recent-audits'
const maxArchivedAudits = 25

export interface LocalAuditArchiveItem {
  cacheId: string
  audit: AuditResult
  savedAt: string
}

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const loadLocalAuditArchive = (): LocalAuditArchiveItem[] => {
  if (!canUseStorage()) return []

  try {
    const raw = window.localStorage.getItem(archiveKey)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalAuditArchiveItem[]
    return Array.isArray(parsed) ? parsed.filter(item => item?.cacheId && item?.audit?.url) : []
  } catch {
    return []
  }
}

export const saveLocalAudit = (audit: AuditResult) => {
  if (!canUseStorage()) return

  const normalizedUrl = normalizeWebsiteUrl(audit.url)
  const cacheId = audit.id || `${audit.domain}-${Date.now()}`
  const nextItem: LocalAuditArchiveItem = {
    cacheId,
    audit: {
      ...audit,
      url: normalizedUrl || audit.url,
      createdAt: audit.createdAt || new Date().toISOString(),
    },
    savedAt: new Date().toISOString(),
  }

  const existing = loadLocalAuditArchive().filter(item => {
    const itemUrl = normalizeWebsiteUrl(item.audit.url)
    return item.cacheId !== cacheId && itemUrl !== normalizedUrl
  })

  window.localStorage.setItem(archiveKey, JSON.stringify([nextItem, ...existing].slice(0, maxArchivedAudits)))
}

export const findLocalAuditByUrl = (url: string) => {
  const normalizedUrl = normalizeWebsiteUrl(url)
  return loadLocalAuditArchive().find(item => normalizeWebsiteUrl(item.audit.url) === normalizedUrl) || null
}

export const findLocalAuditByCacheId = (cacheId: string) => {
  return loadLocalAuditArchive().find(item => item.cacheId === cacheId) || null
}

export const removeLocalAudit = (cacheId: string) => {
  if (!canUseStorage()) return
  const next = loadLocalAuditArchive().filter(item => item.cacheId !== cacheId)
  window.localStorage.setItem(archiveKey, JSON.stringify(next))
}
