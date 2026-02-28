import { useMemo } from 'react'
import { Page } from '@/types'

interface PaginationProps {
  page: Page<unknown>
  onPageChange: (page: number) => void
}

/**
 * Computes which page numbers (and ellipses) to show.
 * Always shows first and last page. Uses a sliding window of
 * `siblings` pages on each side of the current page.
 * Ellipsis replaces gaps of 2+ pages; single-page gaps are absorbed.
 *
 * Example with siblings=2, current=16, total=35:
 *   1 ... 14 15 [16] 17 18 ... 35
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  const siblings = 2

  // If few enough pages, show all without ellipsis
  if (total <= siblings * 2 + 5) {
    return Array.from({ length: total }, (_, i) => i)
  }

  let windowStart = Math.max(1, current - siblings)
  let windowEnd = Math.min(total - 2, current + siblings)

  // Absorb small gaps — don't use "..." to hide just 1 page
  if (windowStart === 2) windowStart = 1
  if (windowEnd === total - 3) windowEnd = total - 2

  const showLeftDots = windowStart > 1
  const showRightDots = windowEnd < total - 2

  const pages: (number | '...')[] = [0]

  if (showLeftDots) pages.push('...')

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i)
  }

  if (showRightDots) pages.push('...')

  pages.push(total - 1)

  return pages
}

export default function Pagination({
  page,
  onPageChange,
}: PaginationProps) {
  const { number: currentPage, totalPages, totalElements, first, last } = page

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  )

  if (totalElements === 0) return null

  return (
    <div className="flex items-center justify-center gap-1 pt-6 pb-2">
      {/* Previous */}
      <button
        type="button"
        disabled={first}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700"
        title="Página anterior"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Page numbers */}
      {pageNumbers.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400 select-none">
            ···
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
              p === currentPage
                ? 'bg-brand-700 text-white shadow-sm cursor-default'
                : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            {p + 1}
          </button>
        )
      )}

      {/* Next */}
      <button
        type="button"
        disabled={last}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-50 hover:text-brand-700"
        title="Próxima página"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
