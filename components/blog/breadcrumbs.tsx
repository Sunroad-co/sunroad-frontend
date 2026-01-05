import Link from 'next/link'

interface BreadcrumbsProps {
  postTitle: string
}

export default function Breadcrumbs({ postTitle }: BreadcrumbsProps) {
  return (
    <nav className="mb-6 sm:mb-8" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm sm:text-base">
        <li>
          <Link
            href="/"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors duration-200"
          >
            Home
          </Link>
        </li>
        <li className="flex items-center" aria-hidden="true">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-sunroad-brown-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </li>
        <li>
          <Link
            href="/blog"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors duration-200"
          >
            Blog
          </Link>
        </li>
        <li className="flex items-center" aria-hidden="true">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-sunroad-brown-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </li>
        <li className="text-sunroad-brown-900 font-medium truncate max-w-[200px] sm:max-w-[400px] md:max-w-none" aria-current="page">
          {postTitle}
        </li>
      </ol>
    </nav>
  )
}

