'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    console.log('🔄 Auth callback: Starting simple redirect...')

    // Simple approach: just wait and redirect
    const timer = setTimeout(() => {
      console.log('🏠 Auth callback: Redirecting to home...')
      window.location.href = '/'
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Always show processing state for simple redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600">Please wait while we complete the sign-in process</p>
      </div>
    </div>
  )
}