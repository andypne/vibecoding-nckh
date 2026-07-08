'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');

        if (!code) {
          setError('Không tìm thấy mã xác thực. Link có thể không hợp lệ.');
          setIsLoading(false);
          return;
        }

        // Exchange code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError('Link không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
          setIsLoading(false);
          return;
        }

        // Success - redirect to home
        router.push('/');
      } catch (err) {
        setError('Đã xảy ra lỗi. Vui lòng thử lại.');
        setIsLoading(false);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition"
          >
            Quay lại
          </a>
        </div>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang xác thực...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
