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
    let timeoutId: NodeJS.Timeout

    const getUser = async () => {
      try {
        console.log('🔍 Checking user authentication...')

        // Remove the delay and get user directly
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('❌ Error getting user:', error.message)

          // If it's a network error, try again after a shorter delay
          if (error.message.includes('fetch') || error.message.includes('network')) {
            console.log('🌐 Network error detected, retrying in 1 second...')
            setTimeout(() => {
              if (mounted) getUser()
            }, 1000)
            return
          }

          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(user)

          if (user) {
            console.log('✅ User authenticated:', user.email || user.id)
            // الترميز التالي للتعامل مع المستخدم المجهول بشكل أفضل
            if (user.id === "00000000-0000-0000-0000-000000000000") {
              setProfile({
                id: user.id,
                full_name: "ضيف",
                avatar_url: null,
                role: "guest",
                email: "guest@example.com"
              });
              setLoading(false);
              return;
            }
            // Fetch profile in parallel with setting loading to false
            fetchProfile(user.id).then(() => {
              if (mounted) setLoading(false)
            }).catch(() => {
              if (mounted) setLoading(false)
            })
          } else {
            console.log('ℹ️ No authenticated user')
            setProfile(null)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error getting user:', error)

        // If it's a network error, try again
        if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
          console.log('🌐 Network error detected, retrying in 1 second...')
          setTimeout(() => {
            if (mounted) getUser()
          }, 1000)
          return
        }

        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Auth check timeout reached, forcing completion...')
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }, 10000) // Reduced to 10 seconds

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email ? `(User: ${session.user.email})` : '(No user)')
        console.log('🔍 Session details:', session ? 'Session exists' : 'No session')

        if (!mounted) {
          console.log('🚫 Component unmounted, ignoring auth change')
          return
        }

        // Clear any existing timeout when auth state changes
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        if (session?.user) {
          console.log('✅ User session found, fetching profile...')
          setUser(session.user)
          try {
            await fetchProfile(session.user.id)
          } catch (profileError) {
            console.error('❌ Error fetching profile in auth change:', profileError)
            // Continue even if profile fetch fails
          }
        } else {
          console.log('ℹ️ No user session, clearing state')
          setUser(null)
          setProfile(null)
        }

        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error)

        // If it's a network error, don't fail completely
        if (error.message.includes('fetch') || error.message.includes('network')) {
          console.warn('🌐 Network error fetching profile, continuing without profile')
          return
        }

        throw error
      } else if (data) {
        console.log('✅ Profile fetched successfully')
        setProfile(data)
      } else {
        console.log('ℹ️ No profile found for user')
        setProfile(null)
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error)
      // Don't throw error, just log it and continue
      setProfile(null)
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
