'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')
  const [showRetry, setShowRetry] = useState(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: Handling OAuth callback...')

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('❌ Auth callback: Error exchanging code for session:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Authentication failed')
            setTimeout(() => router.replace('/login?error=auth_callback_error'), 3000)
            return
          }

          if (data.session) {
            console.log('✅ Auth callback: Session established successfully')
            console.log('👤 User ID:', data.session.user.id)
            setStatus('success')
            
            // Clean up the URL by removing the OAuth code parameter
            const url = new URL(window.location.href)
            url.searchParams.delete('code')
            window.history.replaceState({}, '', url.toString())
            
            // Add a small delay to allow session synchronization
            setTimeout(() => {
              console.log('🔄 Auth callback: Redirecting to home...')
              router.replace('/')
            }, 1000)
          } else {
            console.log('ℹ️ Auth callback: No session after code exchange, redirecting to login')
            setStatus('error')
            setErrorMessage('No session established')
            setTimeout(() => router.replace('/login'), 2000)
          }
        } else {
          // No code in URL, try to get existing session
          const { data, error } = await supabase.auth.getSession()

          if (error) {
            console.error('❌ Auth callback: Error getting session:', error)
            setStatus('error')
            setErrorMessage(error.message || 'Session error')
            setTimeout(() => router.replace('/login?error=auth_callback_error'), 3000)
            return
          }

          if (data.session) {
            console.log('✅ Auth callback: Existing session found')
            setStatus('success')
            setTimeout(() => router.replace('/'), 500)
          } else {
            console.log('ℹ️ Auth callback: No session found, redirecting to login')
            setStatus('error')
            setErrorMessage('No existing session')
            setTimeout(() => router.replace('/login'), 2000)
          }
        }
      } catch (error) {
        console.error('❌ Auth callback: Unexpected error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unexpected error')
        setTimeout(() => router.replace('/login?error=unexpected_error'), 3000)
      }
    }

    handleAuthCallback()

    // Show retry button after 5 seconds if still processing
    const retryTimeout = setTimeout(() => {
      if (status === 'processing') {
        setShowRetry(true)
      }
    }, 5000)

    return () => clearTimeout(retryTimeout)
  }, [router, status])

  // Show different UI based on status
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign-in successful!</h2>
          <p className="text-gray-600">Redirecting you to your dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign-in failed</h2>
          <p className="text-gray-600 mb-4">{errorMessage || 'Something went wrong during sign-in'}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    )
  }

  // Default processing state
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Signing you in...</h2>
        <p className="text-gray-600 mb-6">Please wait while we complete the sign-in process</p>
        
        {/* Manual retry button after timeout or user request */}
        {showRetry && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-4">Taking longer than expected?</p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}