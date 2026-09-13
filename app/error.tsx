'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log error
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">系统出现异常</h1>
        <p className="text-gray-600 mb-6">抱歉，页面加载过程中遇到了问题，请尝试重新加载。</p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          重新尝试
        </button>
      </div>
    </div>
  );
}
