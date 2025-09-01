'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSupabase } from '@/components/SupabaseProvider'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import Image from 'next/image'

interface Class {
  id: string
  name: string
  description: string
  owner_id: string
  join_code: string
  created_at: string
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url?: string | null
  }
}

interface Post {
  id: string
  content: string
  created_at: string
  author_id: string
  class_id: string
  profiles?: {
    full_name: string
    avatar_url?: string
  }
  classes?: {
    name: string
  }
}

interface Assignment {
  id: string
  title: string
  created_at: string
  class_id: string
  classes?: {
    name: string
  }
}

interface RecentActivity {
  id: string
  type: 'post' | 'assignment'
  title: string
  description: string
  author: string
  timestamp: string
  classId: string
}

interface ClassStat {
  classId: string
  memberCount: number
  postCount: number
  assignmentCount: number
  lastActivity: string
}

export default function HomePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDescription, setNewClassDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joiningClass, setJoiningClass] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [platformStats, setPlatformStats] = useState({
    totalClasses: 0,
    totalUsers: 0,
    recentPosts: 0,
    activeUsers: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [classStats, setClassStats] = useState<ClassStat[]>([])
  const { supabase, user, profile, loading } = useSupabase()
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 Home page: useEffect triggered')
    console.log('🏠 Home page: user =', user ? user.email : 'null')
    console.log('🏠 Home page: loading =', loading)

    // If still loading, don't do anything yet
    if (loading) {
      console.log('🏠 Home page: Still loading, waiting...')
      return
    }

    // If no user and not loading, redirect to login
    if (!user && !loading) {
      console.log('🏠 Home page: No user found, redirecting to login...')
      router.push('/login')
      return
    }

    // If user exists and not loading, fetch classes (only once)
    if (user && !loading && classes.length === 0) {
      console.log('🏠 Home page: User found, fetching classes...')
      fetchClasses()
    }
  }, [user, loading, router]) // Removed fetchClasses from dependencies

  const fetchClasses = useCallback(async () => {
    try {
      console.log('📚 Fetching classes for user:', user?.email)

      // Special handling for admin users - they can see ALL classes
      if (profile?.role === 'admin') {
        console.log('👑 Admin user detected, fetching ALL classes in the system')

        const { data: allClasses, error: allClassesError } = await supabase
          .from('classes')
          .select(`
            *,
            profiles:owner_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })

        if (allClassesError) {
          console.error('❌ Error fetching all classes for admin:', allClassesError)
          throw allClassesError
        }

        console.log('✅ Admin fetched all classes successfully:', allClasses?.length || 0, 'classes')
        setClasses(allClasses || [])
        return
      }

      // Regular user logic (non-admin) - Optimized with single query
      console.log('👤 Regular user detected, fetching owned and member classes')

      // Get both owned classes and member classes in parallel
      const [ownedResult, memberResult] = await Promise.all([
        // Get classes owned by user
        supabase
          .from('classes')
          .select(`
            *,
            profiles:owner_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .eq('owner_id', user?.id),

        // Get class_ids where user is a member
        supabase
          .from('class_members')
          .select('class_id')
          .eq('user_id', user?.id)
      ])

      if (ownedResult.error) {
        console.error('❌ Error fetching owned classes:', ownedResult.error)
        throw ownedResult.error
      }

      if (memberResult.error) {
        console.error('❌ Error fetching member data:', memberResult.error)
        throw memberResult.error
      }

      let allClasses = ownedResult.data || []

      // If user is member of classes, fetch those classes
      if (memberResult.data && memberResult.data.length > 0) {
        const classIds = memberResult.data.map((m: { class_id: string }) => m.class_id)
        const { data: memberClasses, error: classesError } = await supabase
          .from('classes')
          .select(`
            *,
            profiles:owner_id (
              full_name,
              email,
              avatar_url
            )
          `)
          .in('id', classIds)

        if (classesError) {
          console.error('❌ Error fetching member classes:', classesError)
          throw classesError
        }

        allClasses = [...allClasses, ...(memberClasses || [])]
      }

      // Remove duplicates efficiently using Map
      const uniqueClassesMap = new Map()
      allClasses.forEach((classItem: Class) => {
        if (!uniqueClassesMap.has(classItem.id)) {
          uniqueClassesMap.set(classItem.id, classItem)
        }
      })
      const uniqueClasses = Array.from(uniqueClassesMap.values())

      console.log('✅ Classes fetched successfully:', uniqueClasses.length, 'classes')
      setClasses(uniqueClasses.sort((a: Class, b: Class) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (error) {
      console.error('❌ Error fetching classes:', error)
      // Don't show alert for now, just log the error
      // In production, you might want to show a user-friendly error message
    }
  }, [user, profile, supabase])

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) return

    if (!user?.id) {
      alert('Please log in first')
      return
    }

    // Check if user has permission to create classes (admin only)
    if (!profile?.role || profile.role !== 'admin') {
      alert('Sorry, only administrators can create classes')
      return
    }

    try {
      // Check if user profile exists
      const { data: _, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile check error:', profileError)
        alert('Please complete your profile first')
        return
      }

      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      console.log('Creating class with data:', {
        name: newClassName,
        description: newClassDescription,
        owner_id: null, // Admin creates class without being the owner initially
        join_code: joinCode,
      })

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: newClassName,
          description: newClassDescription,
          owner_id: user?.id, // Set the admin as the owner of the class
          join_code: joinCode,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      console.log('Class created successfully:', data)

      // Add the admin as a member of the class with admin role
      const { error: memberError } = await supabase
        .from('class_members')
        .insert({
          class_id: data.id,
          user_id: user?.id,
          role: 'admin', // Admin has admin role in the class
        })

      if (memberError) {
        console.error('Error adding admin as member:', memberError)
        // Don't throw here, class is created successfully
        // But log the error for debugging
      } else {
        console.log('Admin added as member successfully')
      }
      
      // Immediately update the classes list
      setClasses(prevClasses => [data, ...prevClasses])
      
      setNewClassName('')
      setNewClassDescription('')
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating class:', error)
      alert(`Error creating class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out user...')
      await supabase.auth.signOut()
      console.log('✅ User signed out successfully')
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('❌ Error signing out:', error)
      alert('Error signing out')
    }
  }

  const joinClass = async (code: string) => {
    console.log('🔗 Starting join class process with code:', code)

    if (!code.trim()) {
      console.log('❌ No code provided')
      return
    }

    if (!user?.id) {
      console.log('❌ No user logged in')
      alert('Please log in first')
      return
    }

    setJoiningClass(true)

    try {
      console.log('🔍 Searching for class with join code:', code.toUpperCase())

      // First find the class by join code
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, owner_id')
        .eq('join_code', code.toUpperCase())
        .single()

      console.log('🔍 Class search result:', { classData, classError })

      if (classError) {
        console.log('❌ Class search error detected:', classError.code, classError.message)
        if (classError.code === 'PGRST116') {
          // This is expected when join code doesn't exist - don't log as error
          console.log('ℹ️ Class not found with code:', code.toUpperCase())
          alert('Invalid join code or class does not exist')
        } else {
          console.error('❌ Class search error:', classError)
          alert('Error searching for class')
        }
        return
      }

      console.log('✅ Found class:', classData)

      // Check if already a member
      console.log('🔍 Checking if user is already a member...')
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('class_members')
        .select('id')
        .eq('class_id', classData.id)
        .eq('user_id', user.id)
        .single()

      console.log('🔍 Member check result:', { existingMember, memberCheckError })

      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('❌ Member check error:', memberCheckError)
        alert('Error checking membership')
        return
      }

      if (existingMember) {
        console.log('ℹ️ User is already a member')
        alert('You are already a member of this class')
        return
      }

      console.log('ℹ️ User is not a member, proceeding with join...')

      console.log('ℹ️ User is not a member, proceeding with join...')

      // Check if user is the owner
      if (classData.owner_id === user.id) {
        console.log('ℹ️ User is the owner of this class')
        alert(`You are already the owner of "${classData.name}"`)
        return
      }

      console.log('📝 Adding user as member...')

      // Add as member
      const { error: memberError } = await supabase
        .from('class_members')
        .insert({
          class_id: classData.id,
          user_id: user.id,
          role: 'student',
        })

      console.log('📝 Member insertion result:', { error: memberError })

      if (memberError) {
        console.error('❌ Member insertion error:', memberError)
        if (memberError.code === '23505') {
          alert('You are already a member of this class')
        } else {
          alert('Error joining class: ' + memberError.message)
        }
        return
      }

      console.log('✅ Successfully joined class:', classData.name)

      // Clear the input
      setJoinCode('')

      // Close the modal
      setShowJoinModal(false)

      // Immediately update the classes list without waiting for fetchClasses
      const newClass = {
        id: classData.id,
        name: classData.name,
        description: '', // We don't have description from join query
        owner_id: classData.owner_id,
        join_code: code.toUpperCase(),
        created_at: new Date().toISOString()
      }

      setClasses(prevClasses => [newClass, ...prevClasses])

      // Also refresh in background to ensure data consistency
      setTimeout(() => {
        fetchClasses()
      }, 1000)

      alert(`Successfully joined "${classData.name}"!`)

    } catch (error) {
      console.error('❌ Unexpected error in joinClass:', error)
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setJoiningClass(false)
    }
  }

  const fetchPlatformStats = useCallback(async () => {
    try {
      // Get total classes count
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })

      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get recent posts count (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: recentPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get active users count (users who logged in recently)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString())

      setPlatformStats({
        totalClasses: totalClasses || 0,
        totalUsers: totalUsers || 0,
        recentPosts: recentPosts || 0,
        activeUsers: activeUsers || 0
      })
    } catch (error) {
      console.error('Error fetching platform stats:', error)
    }
  }, [supabase])

  const fetchRecentActivity = useCallback(async () => {
    if (classes.length === 0) return

    try {
      const classIds = classes.map(c => c.id)

      // Fetch recent posts and assignments in parallel
      const [postsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            author_id,
            class_id,
            profiles:author_id (
              full_name,
              avatar_url
            ),
            classes:class_id (
              name
            )
          `)
          .in('class_id', classIds)
          .order('created_at', { ascending: false })
          .limit(5),

        supabase
          .from('assignments')
          .select(`
            id,
            title,
            created_at,
            class_id,
            classes:class_id (
              name
            )
          `)
          .in('class_id', classIds)
          .order('created_at', { ascending: false })
          .limit(3)
      ])

      const activity = [
        ...(postsResult.data || []).map((post: Post) => ({
          id: post.id,
          type: 'post',
          title: `New post in ${post.classes?.name}`,
          description: post.content?.substring(0, 100) + '...',
          author: post.profiles?.full_name && post.profiles.full_name.trim() !== '' ? post.profiles.full_name : 'مستخدم مجهول',
          timestamp: post.created_at,
          classId: post.class_id
        })),
        ...(assignmentsResult.data || []).map((assignment: Assignment) => ({
          id: assignment.id,
          type: 'assignment',
          title: `New assignment in ${assignment.classes?.name}`,
          description: assignment.title,
          author: 'Professor',
          timestamp: assignment.created_at,
          classId: assignment.class_id
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setRecentActivity(activity.slice(0, 8))
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }, [classes, supabase])

  const fetchClassStats = useCallback(async () => {
    if (classes.length === 0) return

    try {
      const classIds = classes.map(c => c.id)

      // Fetch all stats in parallel with optimized queries
      const [memberStats, postStats, assignmentStats] = await Promise.all([
        // Get member counts for all classes
        supabase
          .from('class_members')
          .select('class_id')
          .in('class_id', classIds),

        // Get post counts for all classes
        supabase
          .from('posts')
          .select('class_id')
          .in('class_id', classIds),

        // Get assignment counts for all classes
        supabase
          .from('assignments')
          .select('class_id')
          .in('class_id', classIds)
      ])

      // Process the results
      const memberCountMap: Record<string, number> = {}
      const postCountMap: Record<string, number> = {}
      const assignmentCountMap: Record<string, number> = {}

      // Count members per class
      if (memberStats.data) {
        memberStats.data.forEach((item: { class_id: string }) => {
          memberCountMap[item.class_id] = (memberCountMap[item.class_id] || 0) + 1
        })
      }

      // Count posts per class
      if (postStats.data) {
        postStats.data.forEach((item: { class_id: string }) => {
          postCountMap[item.class_id] = (postCountMap[item.class_id] || 0) + 1
        })
      }

      // Count assignments per class
      if (assignmentStats.data) {
        assignmentStats.data.forEach((item: { class_id: string }) => {
          assignmentCountMap[item.class_id] = (assignmentCountMap[item.class_id] || 0) + 1
        })
      }

      // Build stats array
      const stats = classes.map((classItem) => ({
        classId: classItem.id,
        memberCount: memberCountMap[classItem.id] || 0,
        postCount: postCountMap[classItem.id] || 0,
        assignmentCount: assignmentCountMap[classItem.id] || 0,
        lastActivity: classItem.created_at
      }))

      setClassStats(stats)
    } catch (error) {
      console.error('Error fetching class stats:', error)
    }
  }, [classes, supabase])

  const filteredClasses = useMemo(() =>
    classes.filter(classItem =>
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [classes, searchQuery])

  const getClassStats = (classId: string) => {
    return classStats.find(stat => stat.classId === classId) || {
      memberCount: 0,
      postCount: 0,
      assignmentCount: 0
    }
  }

  useEffect(() => {
    if (user && classes.length > 0 && profile) {
      // Only fetch stats if we haven't fetched them yet or if classes changed significantly
      const shouldFetchStats = platformStats.totalClasses === 0 ||
                              recentActivity.length === 0 ||
                              classStats.length !== classes.length

      if (shouldFetchStats) {
        fetchPlatformStats()
        fetchRecentActivity()
        fetchClassStats()
      }
    }
  }, [user, classes.length, profile, platformStats.totalClasses, recentActivity.length, classStats.length, fetchPlatformStats, fetchRecentActivity, fetchClassStats]) // Only depend on essential changes

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading your dashboard...</h2>
          <p className="text-gray-600">Please wait while we load your classes</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
  <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Study Platform</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Learn Smart</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              {profile?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="hidden sm:inline">Control Panel</span>
                </button>
              )}
              {profile?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">New Class</span>
                </button>
              )}
              <UserProfile
                user={user}
                profile={profile}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex relative">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          {/* Platform Statistics - تظهر فقط للمدير أو المعلم */}
          {profile?.role !== 'student' && (
            <div className="mb-6 sm:mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Classes</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{platformStats.totalClasses}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{platformStats.activeUsers}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Recent Posts</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{platformStats.recentPosts}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">My Classes</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{classes.length}</p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Recent Activity */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Search */}
            <div className="xl:col-span-2">
              <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
                  <div className="flex-1 relative w-full">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search classes..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity - Only for professors and admins */}
            {profile?.role !== 'student' && (
              <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200/50">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === 'post' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {activity.type === 'post' ? (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.author} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Classes Grid */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">My Classes</h2>
            <p className="text-sm sm:text-base text-gray-600">Explore your classes and track your progress</p>
          </div>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No classes found' : 'No classes yet'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : profile?.role === 'admin'
                    ? 'Start your educational journey by creating a new class or joining an existing one'
                    : 'You can join an existing class using the join code from your professor'
                }
              </p>
              {profile?.role === 'admin' && !searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="ml-2">Create Your First Class</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredClasses.map((classItem, index) => {
                const stats = getClassStats(classItem.id)
                return (
                  <div
                    key={classItem.id}
                    className="group bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => router.push(`/class/${classItem.id}`)}
                  >
                    <div className="h-24 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1">
                          <span className="text-white text-xs sm:text-sm font-medium">
                            {classItem.join_code}
                          </span>
                        </div>
                      </div>
                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                        <div className="flex items-center space-x-2 sm:space-x-4 text-white/90 text-xs sm:text-sm">
                          <div className="flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="ml-1">{stats.memberCount}</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="ml-1">{stats.postCount}</span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {classItem.name}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2">
                        {classItem.profiles?.avatar_url ? (
                          <Image
                            src={classItem.profiles.avatar_url}
                            alt={classItem.profiles.full_name || 'Professor'}
                            width={32}
                            height={32}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full ml-2 border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ml-2 border-2 border-white shadow-sm">
                            <span className="text-white text-xs font-semibold">
                              {(classItem.profiles?.full_name || 'غير محدد').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="mr-1">Professor:</span>
                        <span className="font-medium text-gray-900">
                          {classItem.profiles && typeof classItem.profiles.full_name === 'string' && classItem.profiles.full_name.trim() !== ''
                            ? classItem.profiles.full_name.trim()
                            : 'غير محدد'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
                        {classItem.description || 'No description for this class'}
                      </p>

                      {/* Class Stats */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-semibold text-blue-600">{stats.memberCount}</div>
                          <div className="text-xs text-gray-500">Members</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-semibold text-green-600">{stats.postCount}</div>
                          <div className="text-xs text-gray-500">Posts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base sm:text-lg font-semibold text-purple-600">{stats.assignmentCount}</div>
                          <div className="text-xs text-gray-500">Assignments</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="ml-1">{new Date(classItem.created_at).toLocaleDateString('en-US')}</span>
                        </span>
                        <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                          Enter Class →
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white/80 backdrop-blur-lg border-l border-gray-200/50 p-6 sticky top-0 h-screen overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <nav className="space-y-3 mb-8">
            <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="mr-2">My Classes</span>
              </div>
            </button>
            {profile?.role !== 'student' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 font-medium rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 shadow-sm"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="mr-2">Create New Class</span>
                </div>
              </button>
            )}
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="mr-2">Join Class</span>
              </div>
            </button>
          </nav>

          {/* User Stats */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Your Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Classes Enrolled</span>
                <span className="text-sm font-semibold text-gray-900">{classes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Role</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{profile?.role || 'Student'}</span>
              </div>
              {profile?.role === 'admin' && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-600">Classes Created</span>
                  <span className="text-sm font-semibold text-orange-900">
                    {classes.filter(c => c.owner_id === user?.id || c.owner_id === null).length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Links</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Help & Support
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Settings
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Feedback
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
            <aside className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-white/95 backdrop-blur-lg border-l border-gray-200/50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-3 mb-8">
                <button
                  onClick={() => {
                    setShowMobileSidebar(false)
                    // Scroll to classes section
                  }}
                  className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-medium rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="mr-2">My Classes</span>
                  </div>
                </button>
                {profile?.role !== 'student' && (
                  <button
                    onClick={() => {
                      setShowMobileSidebar(false)
                      setShowCreateForm(true)
                    }}
                    className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 font-medium rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 shadow-sm"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="mr-2">Create New Class</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMobileSidebar(false)
                    setShowJoinModal(true)
                  }}
                  className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="mr-2">Join Class</span>
                  </div>
                </button>
              </nav>

              {/* User Stats */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Your Stats</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Classes Enrolled</span>
                    <span className="text-sm font-semibold text-gray-900">{classes.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{profile?.role || 'Student'}</span>
                  </div>
                  {profile?.role === 'admin' && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm text-orange-600">Classes Created</span>
                      <span className="text-sm font-semibold text-orange-900">
                        {classes.filter(c => c.owner_id === user?.id).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    Help & Support
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    Feedback
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Create Class Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm sm:max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Create New Class</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={createClass} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder="Example: Advanced Mathematics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-sm sm:text-base"
                  rows={3}
                  placeholder="Brief description of the class..."
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-sm sm:max-w-md p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Join Class</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 sm:px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 uppercase text-sm sm:text-base"
                  placeholder="Enter join code (e.g., ABC123)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && joinCode.trim() && user && !joiningClass) {
                      joinClass(joinCode)
                    }
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => joinClass(joinCode)}
                  disabled={!joinCode.trim() || !user || joiningClass}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  {joiningClass && (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  <span>{joiningClass ? 'Joining...' : 'Join Class'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
