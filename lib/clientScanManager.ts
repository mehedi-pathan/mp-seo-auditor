'use client'

import type { AuditResult } from '@/types'
import { normalizeWebsiteUrl } from '@/lib/normalizeUrl'
import { saveLocalAudit } from '@/lib/localAuditArchive'

type ScanJobStatus = 'running' | 'complete' | 'error'
const activeScanStorageKey = 'mp-seo-auditor:active-scan'
const stickyResultStorageKey = 'mp-seo-auditor:sticky-scan-result'

export interface ClientScanJobSnapshot {
  sessionId: string
  url: string
  status: ScanJobStatus
  audit: AuditResult | null
  error: string | null
}

interface ClientScanJob extends ClientScanJobSnapshot {
  promise: Promise<AuditResult>
  listeners: Set<(job: ClientScanJobSnapshot) => void>
}

const jobs = new Map<string, ClientScanJob>()
const globalListeners = new Set<(job: ClientScanJobSnapshot | null) => void>()
let activeJobUrl: string | null = null
let activeSnapshot: ClientScanJobSnapshot | null = null

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const snapshotJob = (job: ClientScanJob): ClientScanJobSnapshot => ({
  sessionId: job.sessionId,
  url: job.url,
  status: job.status,
  audit: job.audit,
  error: job.error,
})

const readStoredSnapshot = (): ClientScanJobSnapshot | null => {
  if (!canUseStorage()) return null

  try {
    const value = window.localStorage.getItem(activeScanStorageKey)
    if (!value) return null
    return JSON.parse(value) as ClientScanJobSnapshot
  } catch {
    return null
  }
}

const persistActiveSnapshot = (snapshot: ClientScanJobSnapshot | null) => {
  activeSnapshot = snapshot

  if (canUseStorage()) {
    if (snapshot) {
      window.localStorage.setItem(activeScanStorageKey, JSON.stringify(snapshot))
    } else {
      window.localStorage.removeItem(activeScanStorageKey)
    }
  }

  globalListeners.forEach(listener => listener(snapshot))
  window.dispatchEvent(new CustomEvent('mp-seo-scan-updated', { detail: snapshot }))
}

export const getActiveScanSnapshot = () => activeSnapshot || readStoredSnapshot()

export const subscribeGlobalScan = (listener: (job: ClientScanJobSnapshot | null) => void) => {
  globalListeners.add(listener)
  listener(getActiveScanSnapshot())

  return () => {
    globalListeners.delete(listener)
  }
}

export const getRunningClientScanJob = () => {
  if (!activeJobUrl) return null
  const job = jobs.get(activeJobUrl)
  return job?.status === 'running' ? job : null
}

export const getStickyScanResult = () => {
  if (!canUseStorage()) return null

  try {
    const value = window.localStorage.getItem(stickyResultStorageKey)
    if (!value) return null
    return JSON.parse(value) as AuditResult
  } catch {
    return null
  }
}

export const clearStickyScanResult = () => {
  if (canUseStorage()) {
    window.localStorage.removeItem(stickyResultStorageKey)
  }
}

export const clearActiveScan = () => {
  activeJobUrl = null
  persistActiveSnapshot(null)
}

const setStickyScanResult = (audit: AuditResult) => {
  if (canUseStorage()) {
    window.localStorage.setItem(stickyResultStorageKey, JSON.stringify(audit))
  }
}

const notify = (job: ClientScanJob) => {
  const snapshot = snapshotJob(job)
  job.listeners.forEach(listener => listener(snapshot))
  if (activeJobUrl === job.url) {
    persistActiveSnapshot(snapshot)
  }
}

export const getClientScanJob = (url: string) => {
  return jobs.get(normalizeWebsiteUrl(url)) || null
}

export const subscribeClientScanJob = (
  url: string,
  listener: (job: ClientScanJobSnapshot) => void,
) => {
  const job = getClientScanJob(url)
  if (!job) return () => undefined

  job.listeners.add(listener)
  listener(snapshotJob(job))

  return () => {
    job.listeners.delete(listener)
  }
}

export const startClientScanJob = (url: string, userId?: string | null) => {
  const normalizedUrl = normalizeWebsiteUrl(url)
  const existing = jobs.get(normalizedUrl)

  if (existing && existing.status === 'running') return existing

  const sessionId = crypto.randomUUID()
  activeJobUrl = normalizedUrl
  clearStickyScanResult()

  const job: ClientScanJob = {
    sessionId,
    url: normalizedUrl,
    status: 'running',
    audit: null,
    error: null,
    listeners: new Set(),
    promise: fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl, userId, sessionId }),
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Scan failed')
        }

        const audit = data as AuditResult
        saveLocalAudit(audit)
        setStickyScanResult(audit)
        job.status = 'complete'
        job.audit = audit
        notify(job)
        return audit
      })
      .catch(error => {
        job.status = 'error'
        job.error = error instanceof Error ? error.message : 'Scan failed'
        notify(job)
        throw error
      }),
  }

  jobs.set(normalizedUrl, job)
  notify(job)
  return job
}
