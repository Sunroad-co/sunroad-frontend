import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5dc] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Artist Not Found</h1>
        <p className="text-gray-600 mb-8">The artist you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
        <Link 
          href="/"
          prefetch={false}
          className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}

