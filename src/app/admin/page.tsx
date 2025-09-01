'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSupabase } from '@/components/SupabaseProvider'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface ClassData {
  id: string
  name: string
  description: string
  join_code: string
  created_at: string
  owner: {
    full_name: string
  } | null
}

interface MemberData {
  user_id: string
  role: string
  profiles: {
    id: string
    full_name: string | null
    email: string | null
  } | null
}

interface AssignmentData {
  id: string
  file_url: string | null
}

interface QuestionData {
  id: string
}

interface ClassStats {
  id: string
  name: string
  description: string
  owner_name: string
  join_code: string
  member_count: number
  post_count: number
  members: Array<{
    id: string
    full_name: string
    email: string
    role: string
  }>
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [classes, setClasses] = useState<ClassStats[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingClass, setDeletingClass] = useState<string | null>(null)
  const { supabase, user, profile } = useSupabase()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Check if user is authenticated first
      if (!user) {
        console.log('❌ No authenticated user, cannot fetch admin data')
        setLoading(false)
        return
      }

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('❌ Error fetching users:', usersError)

        // If it's an auth error, redirect to login
        if (usersError.message?.includes('JWT') || usersError.message?.includes('session') || usersError.message?.includes('auth')) {
          console.log('🔐 Auth error detected, redirecting to login...')
          alert('Session expired, please sign in again')
          router.push('/login')
          return
        }

        throw usersError
      }

      console.log('📋 Users data:', usersData) // Debug log

      // Fetch classes with stats
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          join_code,
          created_at,
          owner:profiles!classes_owner_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (classesError) {
        console.error('❌ Error fetching classes:', classesError)

        // If it's an auth error, redirect to login
        if (classesError.message?.includes('JWT') || classesError.message?.includes('session') || classesError.message?.includes('auth')) {
          console.log('🔐 Auth error detected, redirecting to login...')
          alert('Session expired, please sign in again')
          router.push('/login')
          return
        }

        throw classesError
      }

      // Get member counts and details for each class
      const classesWithStats = await Promise.all(
        classesData.map(async (classItem: ClassData) => {
          // Get members
          const { data: members, error: membersError } = await supabase
            .from('class_members')
            .select(`
              user_id,
              role,
              profiles (
                id,
                full_name,
                email
              )
            `)
            .eq('class_id', classItem.id)

          if (membersError) {
            console.error('Error fetching members for class', classItem.id, membersError)
            return {
              ...classItem,
              owner_name: classItem.owner?.full_name && classItem.owner.full_name.trim() !== '' ? classItem.owner.full_name : 'غير محدد',
              member_count: 0,
              post_count: 0,
              members: []
            }
          }

          // Get post count
          const { count: postCount, error: postError } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', classItem.id)

          if (postError) {
            console.error('Error fetching posts for class', classItem.id, postError)
          }

          return {
            ...classItem,
            owner_name: classItem.owner?.full_name && classItem.owner.full_name.trim() !== '' ? classItem.owner.full_name : 'غير محدد',
            member_count: members?.length || 0,
            post_count: postCount || 0,
            members: members?.map((m: MemberData) => ({
              id: m.profiles?.id || m.user_id || '',
              full_name: m.profiles?.full_name && m.profiles.full_name.trim() !== '' ? m.profiles.full_name : `مستخدم ${m.user_id?.slice(0, 8) || ''}`,
              email: m.profiles?.email || '',
              role: m.role
            })) || []
          }
        })
      )

      setUsers(usersData || [])
      console.log('✅ Users fetched successfully:', usersData?.length || 0, 'users')
      setClasses(classesWithStats)
      console.log('✅ Classes fetched successfully:', classesWithStats.length, 'classes')
      console.log('📊 Class stats:', classesWithStats.map(c => ({
        name: c.name,
        members: c.member_count,
        posts: c.post_count
      })))
    } catch (error) {
      console.error('❌ Error fetching admin data:', error)

      // If it's an auth error, redirect to login
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' &&
          (error.message?.includes('JWT') || error.message?.includes('session') || error.message?.includes('auth') || error.message?.includes('AuthSessionMissingError'))) {
        console.log('🔐 Auth error detected, redirecting to login...')
        alert('Session expired, please sign in again')
        router.push('/login')
        return
      }

      alert('Error fetching data')
    } finally {
      setLoading(false)
    }
  }, [user, supabase, router])

  useEffect(() => {
    if (!user || !profile) return

    // Check if user is admin
    if (profile.role !== 'admin') {
      alert('You do not have permission to access this page')
      router.push('/')
      return
    }

    fetchData()
  }, [user, profile, router, fetchData])

  // Handle case where user is not authenticated
  useEffect(() => {
    if (!user && !loading) {
      console.log('❌ No authenticated user detected, redirecting to login...')
      router.push('/login')
    }
  }, [user, loading, router])

  // Add effect to refresh data when page becomes visible or focused
  useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') return

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Admin page became visible, refreshing data...')
        fetchData()
      }
    }

    const handleFocus = () => {
      console.log('🔄 Admin page focused, refreshing data...')
      fetchData()
    }

    const handleBeforeUnload = () => {
      // Clear any cached data when leaving the page
      console.log('🚪 Admin leaving page, clearing cache...')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, profile, fetchData])

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to promote this user to ${newRole === 'Professor' ? 'Professor' : 'Student'}?`)) {
      return
    }

    // Check if user is authenticated
    if (!user) {
      console.log('❌ No authenticated user, cannot update role')
      alert('Session expired, please sign in again')
      router.push('/login')
      return
    }

    setUpdatingRole(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating user role:', error)

        // If it's an auth error, redirect to login
        if (error.message?.includes('JWT') || error.message?.includes('session') || error.message?.includes('auth')) {
          console.log('🔐 Auth error detected, redirecting to login...')
          alert('Session expired, please sign in again')
          router.push('/login')
          return
        }

        throw error
      }

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      )

      alert('Role updated successfully')
    } catch (error) {
      console.error('❌ Error updating user role:', error)

      // If it's an auth error, redirect to login
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' &&
          (error.message?.includes('JWT') || error.message?.includes('session') || error.message?.includes('auth') || error.message?.includes('AuthSessionMissingError'))) {
        console.log('🔐 Auth error detected, redirecting to login...')
        alert('Session expired, please sign in again')
        router.push('/login')
        return
      }

      alert('Error updating role')
    } finally {
      setUpdatingRole(null)
    }
  }

  const deleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete the class "${className}"? This action cannot be undone and will delete all posts, assignments, submissions, and member associations.`)) {
      return
    }

    // Check if user is authenticated
    if (!user) {
      console.log('❌ No authenticated user, cannot delete class')
      alert('Session expired, please sign in again')
      router.push('/login')
      return
    }

    setDeletingClass(classId)

    try {
      console.log('🗑️ Starting class deletion process for:', className)

      // 1. Delete all posts and their files
      const { data: posts, error: postsFetchError } = await supabase
        .from('posts')
        .select('id, file_url, file_urls')
        .eq('class_id', classId)

      if (postsFetchError) {
        console.error('❌ Error fetching posts:', postsFetchError)
      } else if (posts && posts.length > 0) {
        console.log('📄 Found', posts.length, 'posts to delete')

        // Delete post files from storage
        for (const post of posts) {
          const filesToDelete = []

          if (post.file_url) {
            const filePath = post.file_url.split('/').pop()
            if (filePath) filesToDelete.push(`posts/${classId}/${filePath}`)
          }

          if (post.file_urls && Array.isArray(post.file_urls)) {
            post.file_urls.forEach((url: string) => {
              const filePath = url.split('/').pop()
              if (filePath) filesToDelete.push(`posts/${classId}/${filePath}`)
            })
          }

          if (filesToDelete.length > 0) {
            console.log('🗂️ Deleting post files:', filesToDelete)
            const { error: storageError } = await supabase.storage
              .from('class-files')
              .remove(filesToDelete)

            if (storageError) {
              console.error('❌ Error deleting post files:', storageError)
            }
          }
        }

        // Delete posts from database
        const { error: postsDeleteError } = await supabase
          .from('posts')
          .delete()
          .eq('class_id', classId)

        if (postsDeleteError) {
          console.error('❌ Error deleting posts:', postsDeleteError)
        } else {
          console.log('✅ Posts deleted successfully')
        }
      }

      // 2. Delete all assignments and their files
      const { data: assignments, error: assignmentsFetchError } = await supabase
        .from('assignments')
        .select('id, file_url')
        .eq('class_id', classId)

      if (assignmentsFetchError) {
        console.error('❌ Error fetching assignments:', assignmentsFetchError)
      } else if (assignments && assignments.length > 0) {
        console.log('📝 Found', assignments.length, 'assignments to delete')

        // Delete assignment files from storage
        for (const assignment of assignments) {
          if (assignment.file_url) {
            const filePath = assignment.file_url.split('/').pop()
            if (filePath) {
              console.log('🗂️ Deleting assignment file:', `assignments/${classId}/${filePath}`)
              const { error: storageError } = await supabase.storage
                .from('assignment-files')
                .remove([`assignments/${classId}/${filePath}`])

              if (storageError) {
                console.error('❌ Error deleting assignment file:', storageError)
              }
            }
          }
        }

        // Delete submissions first
        const { error: submissionsDeleteError } = await supabase
          .from('submissions')
          .delete()
          .in('assignment_id', assignments.map((a: AssignmentData) => a.id))

        if (submissionsDeleteError) {
          console.error('❌ Error deleting submissions:', submissionsDeleteError)
        } else {
          console.log('✅ Submissions deleted successfully')
        }

        // Delete assignments
        const { error: assignmentsDeleteError } = await supabase
          .from('assignments')
          .delete()
          .eq('class_id', classId)

        if (assignmentsDeleteError) {
          console.error('❌ Error deleting assignments:', assignmentsDeleteError)
        } else {
          console.log('✅ Assignments deleted successfully')
        }
      }

      // 3. Delete all questions and answers
      const { data: questions, error: questionsFetchError } = await supabase
        .from('questions')
        .select('id')
        .eq('class_id', classId)

      if (questionsFetchError) {
        console.error('❌ Error fetching questions:', questionsFetchError)
      } else if (questions && questions.length > 0) {
        console.log('❓ Found', questions.length, 'questions to delete')

        // Delete answers first
        const { error: answersDeleteError } = await supabase
          .from('answers')
          .delete()
          .in('question_id', questions.map((q: QuestionData) => q.id))

        if (answersDeleteError) {
          console.error('❌ Error deleting answers:', answersDeleteError)
        } else {
          console.log('✅ Answers deleted successfully')
        }

        // Delete questions
        const { error: questionsDeleteError } = await supabase
          .from('questions')
          .delete()
          .eq('class_id', classId)

        if (questionsDeleteError) {
          console.error('❌ Error deleting questions:', questionsDeleteError)
        } else {
          console.log('✅ Questions deleted successfully')
        }
      }

      // 4. Delete class members
      const { error: membersDeleteError } = await supabase
        .from('class_members')
        .delete()
        .eq('class_id', classId)

      if (membersDeleteError) {
        console.error('❌ Error deleting class members:', membersDeleteError)
      } else {
        console.log('✅ Class members deleted successfully')
      }

      // 5. Finally, delete the class itself
      const { error: classDeleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (classDeleteError) {
        console.error('❌ Error deleting class:', classDeleteError)
        throw classDeleteError
      }

      console.log('✅ Class deleted successfully')

      // Update local state
      setClasses(prevClasses => prevClasses.filter(c => c.id !== classId))

      alert(`Class "${className}" has been deleted successfully`)
    } catch (error) {
      console.error('❌ Error deleting class:', error)

      // If it's an auth error, redirect to login
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' &&
          (error.message?.includes('JWT') || error.message?.includes('session') || error.message?.includes('auth') || error.message?.includes('AuthSessionMissingError'))) {
        console.log('🔐 Auth error detected, redirecting to login...')
        alert('Session expired, please sign in again')
        router.push('/login')
        return
      }

      alert('Error deleting class: ' + (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error'))
    } finally {
      setDeletingClass(null)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('🚪 Signing out admin user...')
      await supabase.auth.signOut()
      console.log('✅ Admin user signed out successfully')
      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('❌ Error signing out admin:', error)
      alert('Error signing out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-sm sm:text-base text-gray-600">We are preparing the admin dashboard data</p>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Manage users and classes</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={fetchData}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-100 text-green-700 font-medium rounded-xl hover:bg-green-200 transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline ml-2">Refresh Data</span>
                <span className="sm:hidden ml-1">Refresh</span>
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline ml-2">Sign Out</span>
                <span className="sm:hidden ml-1">Logout</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm"
              >
                <svg className="w-4 h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline ml-2">Back to Home</span>
                <span className="sm:hidden ml-1">Home</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Classes</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm text-gray-600">Total Files</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{classes.reduce((sum, c) => sum + c.post_count, 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-3 sm:mr-4">
                <p className="text-xs sm:text-sm text-gray-600">Professors</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'Professor').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">User Management</h2>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
          </div>

          {filteredUsers.length === 0 && users.length > 0 && (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-2xl mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-sm sm:text-base text-gray-600">No users match your search criteria</p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Registration Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{user.full_name}</td>
                        <td className="py-3 px-4 text-gray-700">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'Professor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' :
                             user.role === 'Professor' ? 'Professor' : 'Student'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('en-US')}
                        </td>
                        <td className="py-3 px-4">
                          {user.role !== 'admin' && (
                            <div className="flex space-x-2">
                              {user.role === 'student' && (
                                <button
                                  onClick={() => updateUserRole(user.id, 'Professor')}
                                  disabled={updatingRole === user.id}
                                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                                >
                                  {updatingRole === user.id ? (
                                    <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  Promote to Professor
                                </button>
                              )}
                              {user.role === 'Professor' && (
                                <button
                                  onClick={() => updateUserRole(user.id, 'student')}
                                  disabled={updatingRole === user.id}
                                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                  {updatingRole === user.id ? (
                                    <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                  )}
                                  Demote to Student
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-base">{user.full_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(user.created_at).toLocaleDateString('en-US')}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-3 ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'Professor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' :
                         user.role === 'Professor' ? 'Professor' : 'Student'}
                      </span>
                    </div>
                    {user.role !== 'admin' && (
                      <div className="flex gap-2">
                        {user.role === 'student' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'Professor')}
                            disabled={updatingRole === user.id}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                          >
                            {updatingRole === user.id ? (
                              <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Promote to Professor
                          </button>
                        )}
                        {user.role === 'Professor' && (
                          <button
                            onClick={() => updateUserRole(user.id, 'student')}
                            disabled={updatingRole === user.id}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                          >
                            {updatingRole === user.id ? (
                              <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                            Demote to Student
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>        {/* Classes Overview */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Classes Overview</h2>

          {classes.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-2xl mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No classes found</h3>
              <p className="text-sm sm:text-base text-gray-600">No classes have been created in the system yet</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {classes.map((classItem) => (
                <div key={classItem.id} className="border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start mb-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{classItem.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{classItem.description}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                        <span>Professor: {classItem.owner_name}</span>
                        <span>Join Code: {classItem.join_code}</span>
                        <span>Created: {new Date(classItem.created_at).toLocaleDateString('en-US')}</span>
                      </div>
                    </div>
                    <div className="w-full lg:w-auto lg:text-left">
                      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-xl sm:text-2xl font-bold text-blue-600">{classItem.member_count}</div>
                          <div className="text-xs sm:text-sm text-blue-700">Students</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-xl sm:text-2xl font-bold text-green-600">{classItem.post_count}</div>
                          <div className="text-xs sm:text-sm text-green-700">Files</div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteClass(classItem.id, classItem.name)}
                          disabled={deletingClass === classItem.id}
                          className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                        >
                          {deletingClass === classItem.id ? (
                            <svg className="w-4 h-4 animate-spin ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          {deletingClass === classItem.id ? 'Deleting...' : 'Delete Class'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {classItem.members.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Students List:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {classItem.members.map((member) => (
                          <div key={member.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-900 text-sm">{member.full_name}</div>
                            <div className="text-xs sm:text-sm text-gray-600">{member.email}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {member.role === 'student' ? 'Student' : 'Professor'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}