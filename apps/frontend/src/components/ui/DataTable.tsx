'use client';

import React, { useState } from 'react';
import { SearchInput } from './Input';
import { Button } from './Button';
import { SkeletonRow } from '@/components/ui/Skeleton';
import { EmptyState } from './EmptyState';
import { Filter, ChevronLeft, ChevronRight, MoreHorizontal, Database } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  rowKeyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'No entries match your search criteria. Try adjusting filters or create a new entry.',
  onRowClick,
  pageSize = 5,
  rowKeyExtractor,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Simple client-side search filtering
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item as any).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [data, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="vf-card overflow-hidden flex flex-col">
      {/* Table Controls Header */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="secondary" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
            Filter
          </Button>
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredData.length}</strong> entries
          </span>
        </div>
      </div>

      {/* Table Data Body */}
      <div className="overflow-x-auto custom-scrollbar flex-1 min-h-[250px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/70 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase tracking-wider text-right w-12">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <SkeletonRow key={idx} columns={columns.length + 1} />
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 px-4 text-center">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={<Database className="w-6 h-6 text-slate-400" />}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={rowKeyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3 text-slate-700 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row, rIdx)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : ''}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {!isLoading && filteredData.length > 0 && (
        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <strong className="text-slate-800">{currentPage}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
