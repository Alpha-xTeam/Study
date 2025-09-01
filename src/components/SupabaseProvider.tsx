'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  email: string
}

type SupabaseContext = {
  supabase: ReturnType<typeof createBrowserClient>
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing auth state...')

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error getting initial session:', error)
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        if (session?.user) {
          console.log('✅ Initial session found, fetching profile...')
          if (mounted) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          }
        } else {
          console.log('ℹ️ No initial session found')
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    // Set timeout for loading state
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth initialization timeout reached, forcing completion...')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }, 30000) // Increased to 30 seconds for new users

    // Initialize auth
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email ? `(User: ${session.user.email})` : '(No user)')

        if (!mounted) {
          console.log('🚫 Component unmounted, ignoring auth change')
          return
        }

        // Clear timeout when auth state changes
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        if (session?.user) {
          console.log('✅ User session found, fetching profile...')
          setUser(session.user)

          // Add a small delay to ensure profile is saved after auth callback
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              if (mounted) {
                await fetchProfile(session.user.id)
              }
            }, 500) // Reduced delay for better UX
          } else {
            await fetchProfile(session.user.id)
          }
        } else {
          console.log('ℹ️ No user session, clearing state')
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [supabase])

  const fetchProfile = async (userId: string, retryCount = 0) => {
    const maxRetries = 3
    const retryDelay = 1000 * (retryCount + 1) // Exponential backoff

    try {
      console.log(`👤 Fetching profile for user: ${userId} (attempt ${retryCount + 1}/${maxRetries + 1})`)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error)

        // If it's a network error and we haven't exceeded retries, try again
        if ((error.message.includes('fetch') || error.message.includes('network')) && retryCount < maxRetries) {
          console.log(`🌐 Network error, retrying in ${retryDelay}ms...`)
          setTimeout(() => {
            fetchProfile(userId, retryCount + 1)
          }, retryDelay)
          return
        }

        throw error
      } else if (data) {
        console.log('✅ Profile fetched successfully')
        setProfile(data)
      } else if (error?.code === 'PGRST116') {
        // Profile doesn't exist - this is expected for new users
        console.log('ℹ️ Profile not found for user - this is normal for new users')
        setProfile(null)
      } else {
        console.log('ℹ️ No profile found for user')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      // Don't throw error, just log it and continue
      setProfile(null)
    } finally {
      // Always set loading to false after profile fetch attempt
      setLoading(false)
    }
  }

  const value = {
    supabase,
    user,
    profile,
    loading,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}