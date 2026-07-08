'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔍 Radar nghiên cứu
        </h1>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
          ) : user ? (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition font-medium"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
