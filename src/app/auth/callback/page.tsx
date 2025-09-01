'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthCallback() {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Auth callback: Processing OAuth response...')
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // Wait a bit for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500)) // Reduced from 1000ms

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Auth callback error:', error)
          setError('Authentication failed. Please try again.')
          setIsProcessing(false)
          return
        }

        if (data.session) {
          console.log('✅ Auth callback: Session found, checking profile...')

          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.session.user.id)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            console.log('📝 Auth callback: Profile not found, creating new profile...')
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                full_name: data.session.user.user_metadata?.full_name ||
                          data.session.user.user_metadata?.name ||
                          data.session.user.email?.split('@')[0] ||
                          'New User',
                avatar_url: data.session.user.user_metadata?.avatar_url,
                role: 'student',
                email: data.session.user.email,
              })

            if (insertError) {
              console.error('❌ Auth callback: Error creating profile:', insertError)
              setError('Failed to create user profile. Please try again.')
              setIsProcessing(false)
              return
            }
            console.log('✅ Auth callback: Profile created successfully')
          } else if (profileError) {
            console.error('❌ Auth callback: Error checking profile:', profileError)
            setError('Failed to verify user profile. Please try again.')
            setIsProcessing(false)
            return
          } else {
            console.log('✅ Auth callback: Profile already exists')
          }

          console.log('🚀 Auth callback: Redirecting to home...')
          setIsProcessing(false)

          // Add a small delay to ensure the profile is properly saved
          setTimeout(() => {
            router.push('/')
          }, 200) // Reduced from 500ms
        } else {
          console.log('❌ Auth callback: No session found')
          setError('No authentication session found. Please try logging in again.')
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('❌ Auth callback: Unexpected error:', error)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isProcessing) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Success!</h2>
        <p className="text-gray-600">Redirecting you to the dashboard...</p>
      </div>
    </div>
  )
}