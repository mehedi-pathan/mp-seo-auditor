'use client'

import { create } from 'zustand'
import type { AuditResult } from '@/types'

interface ScanState {
  isScanning: boolean
  scanProgress: number
  currentStep: string
  recentDomains: string[]
  lastScans: AuditResult[]
  
  setIsScanning: (isScanning: boolean) => void
  setScanProgress: (progress: number) => void
  setCurrentStep: (step: string) => void
  addRecentDomain: (domain: string) => void
  addLastScan: (scan: AuditResult) => void
  clearScan: () => void
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  scanProgress: 0,
  currentStep: '',
  recentDomains: [],
  lastScans: [],
  
  setIsScanning: (isScanning) => set({ isScanning }),
  setScanProgress: (scanProgress) => set({ scanProgress }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  
  addRecentDomain: (domain) => set((state) => ({
    recentDomains: [domain, ...state.recentDomains].slice(0, 3),
  })),
  
  addLastScan: (scan) => set((state) => ({
    lastScans: [scan, ...state.lastScans].slice(0, 5),
  })),
  
  clearScan: () => set({
    isScanning: false,
    scanProgress: 0,
    currentStep: '',
  }),
}))
