'use client'

import Link from 'next/link'
import { getMissingLabel, getMissingHref, normalizeMissingKeys } from '@/lib/profile-completion'

interface ProfileCompletionGateProps {
  missing: string[]
  onClose?: () => void
  variant?: 'modal' | 'banner'
}

export default function ProfileCompletionGate({
  missing,
  onClose,
  variant = 'modal',
}: ProfileCompletionGateProps) {
  // Normalize missing keys (backend -> frontend, dedupe, stable order)
  const normalizedMissing = normalizeMissingKeys(missing)
  
  if (normalizedMissing.length === 0) {
    return null
  }

  const content = (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-sunroad-brown-900 mb-2">
          Complete your profile to upgrade
        </h3>
        <p className="text-sm text-sunroad-brown-600 mb-4">
          Please complete the following items before upgrading to Pro:
        </p>
      </div>

      <ul className="space-y-2">
        {normalizedMissing.map((key) => {
          const label = getMissingLabel(key)
          const href = getMissingHref(key)
          return (
            <li key={key} className="flex items-center">
              <svg
                className="w-5 h-5 text-amber-600 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <Link
                href={href}
                className="text-sm text-sunroad-amber-700 hover:text-sunroad-amber-800 hover:underline"
                onClick={onClose}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )

  if (variant === 'banner') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        {content}
      </div>
    )
  }

  // Modal variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {content}
        {onClose && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
