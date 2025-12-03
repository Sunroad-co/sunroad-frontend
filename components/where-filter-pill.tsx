'use client'

interface WhereFilterPillProps {
  embedded?: boolean
  onActiveChange?: (isActive: boolean) => void
  showLabel?: boolean
}

export default function WhereFilterPill({ embedded = false, onActiveChange, showLabel = true }: WhereFilterPillProps) {
  if (!showLabel && embedded) {
    return (
      <div className="text-sm text-gray-500 min-w-0">
        Location filter
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1 text-sm text-gray-700 cursor-not-allowed transition-colors w-full ${
        embedded
          ? 'h-full rounded-none border-0 bg-transparent px-4 py-3 text-left'
          : 'rounded-full border border-gray-200 bg-white min-w-[80px] px-3 py-2'
      }`}
      title="Location filter coming soon"
      disabled
      onFocus={() => onActiveChange?.(true)}
      onBlur={() => onActiveChange?.(false)}
    >
      <span className="truncate">Where</span>
    </button>
  )
}

