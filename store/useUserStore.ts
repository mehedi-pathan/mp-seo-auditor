'use client'

import { create } from 'zustand'
import type { Plan, UserProfile } from '@/types'

interface UserState {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  
  setUser: (user: UserProfile | null) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  updatePlan: (plan: Plan) => void
  updateScansToday: (count: number) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  updatePlan: (plan) => set((state) => ({
    user: state.user ? { ...state.user, plan } : null,
  })),
  
  updateScansToday: (scansToday) => set((state) => ({
    user: state.user ? { ...state.user, scansToday } : null,
  })),
  
  logout: () => set({
    user: null,
    error: null,
  }),
}))
