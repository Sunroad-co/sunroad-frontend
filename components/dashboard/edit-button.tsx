'use client'

import { ReactNode } from 'react'

interface EditButtonProps {
  onClick: () => void
  label: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white'
  children?: ReactNode
}

export default function EditButton({ 
  onClick, 
  label, 
  size = 'md', 
  variant = 'default',
  children 
}: EditButtonProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  }

  const variantClasses = {
    default: 'bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white',
    white: 'bg-white/90 hover:bg-white text-sunroad-brown-800'
  }

  return (
    <button
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full shadow-lg hover:shadow-xl
        transition-all duration-200 transform hover:scale-105
        flex items-center justify-center
        group
      `}
      aria-label={label}
      title={label}
    >
      {children || (
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
          />
        </svg>
      )}
    </button>
  )
}
