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

    // Initialize auth immediately without timeout
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email ? `(User: ${session.user.email})` : '(No user)')

        if (!mounted) {
          console.log('🚫 Component unmounted, ignoring auth change')
          return
        }

        if (session?.user) {
          console.log('✅ User session found, fetching profile...')
          setUser(session.user)
          // Fetch profile immediately without delay
          await fetchProfile(session.user.id)
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