import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-700 dark:border-primary-900 dark:border-t-primary-400 animate-spin"
          aria-hidden
        />
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Memuat konten Desa Anabanua...
        </p>
      </div>
    </div>
  );
}