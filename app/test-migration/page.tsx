'use client'

import { useState } from 'react'

export default function TestMigrationPage() {
  const [email, setEmail] = useState('')
  const [encodedPassword, setEncodedPassword] = useState('')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testMigration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/migrate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          encodedPassword
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const checkUserExists = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/migrate-user?email=${encodeURIComponent(email)}`)
      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Check failed')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const decodePassword = () => {
    try {
      const decoded = Buffer.from(encodedPassword, 'base64').toString('utf-8')
      setResult({ decodedPassword: decoded })
    } catch {
      setError('Invalid Base64 format')
    }
  }

  const clearResults = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🧪 User Migration Test
          </h1>
          
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            {/* Encoded Password Input */}
            <div>
              <label htmlFor="encodedPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Base64 Encoded Password
              </label>
              <input
                id="encodedPassword"
                type="text"
                value={encodedPassword}
                onChange={(e) => setEncodedPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="UGFzc3dvcmQxJA=="
              />
              <p className="text-xs text-gray-500 mt-1">
                This should be the Base64-encoded password from your legacy system
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={testMigration}
                disabled={loading || !email || !encodedPassword}
                className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '⏳ Migrating...' : '🚀 Migrate User'}
              </button>
              
              <button
                onClick={checkUserExists}
                disabled={loading || !email}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '⏳ Checking...' : '🔍 Check User Exists'}
              </button>
              
              <button
                onClick={decodePassword}
                disabled={!encodedPassword}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                🔓 Decode Password
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                🗑️ Clear
              </button>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">✅ Success</h3>
                <pre className="text-sm text-green-700 bg-green-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">❌ Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-lg font-medium text-blue-800 mb-2">📋 Instructions</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Migrate User:</strong> Creates a new user in Supabase Auth with the decoded password</li>
                <li>• <strong>Check User Exists:</strong> Verifies if a user already exists in Supabase</li>
                <li>• <strong>Decode Password:</strong> Shows what the Base64 password decodes to (for verification)</li>
                <li>• Use real email and Base64 password from your legacy system</li>
              </ul>
            </div>

          
          </div>
        </div>
      </div>
    </div>
  )
}
