"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 rounded-lg border border-red-100">
      <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong!</h2>
      <p className="text-red-600 mb-6 text-center max-w-md">
        We encountered an error while communicating with the backend API. The service might be temporarily unavailable.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
