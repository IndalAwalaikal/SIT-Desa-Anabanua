'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, totalPages, total, onPageChange }: PaginationControlsProps) {
  if (total === 0) return null;

  return (
    <nav aria-label="Navigasi halaman daftar" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Halaman {page} dari {Math.max(1, totalPages)} · {total.toLocaleString('id-ID')} data
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
