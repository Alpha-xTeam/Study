'use client'

import { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { useSupabase } from './SupabaseProvider'

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  email: string
}

interface UserProfileProps {
  user: User | null;
  profile: UserProfile | null;
  onSignOut: () => void;
}

export function UserProfile({ user, profile, onSignOut }: UserProfileProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number; maxHeight?: number } | null>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || (user?.id === "00000000-0000-0000-0000-000000000000" ? "ضيف" : "مستخدم مجهول");
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // إضافة تحقق للتأكد من أن القائمة لا تتجاوز حدود الشاشة
      const maxHeight = window.innerHeight - rect.bottom - 20; // ترك مساحة للهامش
      
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        right: Math.min(window.innerWidth - rect.right, window.innerWidth - 200), // تأكد من عدم خروج القائمة عن حدود الشاشة
        maxHeight: maxHeight,
      });
    }
  }, [showDropdown]);

  const dropdownContent = (
    <>
      <div className="fixed inset-0 z-50" onClick={() => setShowDropdown(false)}></div>
      <div
        style={dropdownPos ? {
          position: 'fixed',
          top: dropdownPos.top,
          right: dropdownPos.right,
          width: '16rem',
          maxHeight: dropdownPos.maxHeight ? `${dropdownPos.maxHeight}px` : 'auto',
          overflowY: 'auto',
          zIndex: 60,
        } : {}}
        className="bg-white rounded-2xl shadow-xl border border-gray-200/50 backdrop-blur-lg"
      >
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full border-2 border-gray-200" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-gray-200">
                <span className="text-white font-semibold">{displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 text-right">
              <div className="font-semibold text-gray-900">{displayName}</div>
              {/* حذف عرض البريد الإلكتروني بناءً على طلب المستخدم */}
              <div className="text-xs text-blue-600 capitalize font-medium">
                {profile?.role === 'admin' ? 'Admin' : profile?.role === 'Professor' ? 'Professor' : 'Student'}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-right">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">Profile</span>
            </button>
            <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-right">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Settings</span>
            </button>
            <div className="border-t border-gray-100 my-2"></div>
            {profile?.role === 'admin' && (
              <button
                onClick={() => {
                  setShowDropdown(false);
                  router.push('/admin');
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors text-right mb-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">Control Panel</span>
              </button>
            )}
            <button
              onClick={onSignOut}
              className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
      >
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full border-2 border-white shadow-lg" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <span className="text-white font-semibold text-sm">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden md:block text-right">
          <div className="text-sm font-semibold text-gray-900">{displayName}</div>
          <div className="text-xs text-gray-500 capitalize">
            {profile?.role === 'admin' ? 'Admin' : profile?.role === 'Professor' ? 'Professor' : 'Student'}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {showDropdown && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
}
