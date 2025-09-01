'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: Handling OAuth callback...')

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Auth callback: Error getting session:', error)
          // Redirect to login on error
          window.location.href = '/login?error=auth_callback_error'
          return
        }

        if (data.session) {
          console.log('✅ Auth callback: Session established successfully')
          // Redirect to home after successful authentication
          window.location.href = '/'
        } else {
          console.log('ℹ️ Auth callback: No session found, redirecting to login')
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('❌ Auth callback: Unexpected error:', error)
        window.location.href = '/login?error=unexpected_error'
      }
    }

    handleAuthCallback()
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