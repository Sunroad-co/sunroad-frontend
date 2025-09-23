'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface MigrationResult {
  user_id: string
  email: string
  status: 'pending' | 'migrated' | 'failed' | 'skipped'
  auth_user_id?: string
  error?: string
  legacy_user_id?: string
}

interface MigrationStats {
  total: number
  migrated: number
  failed: number
  skipped: number
  pending: number
}

interface DashboardStats {
  totalLegacy: number
  totalMigrated: number
  remaining: number
}

export default function MigrationDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<MigrationResult[]>([])
  const [stats, setStats] = useState<MigrationStats>({ total: 0, migrated: 0, failed: 0, skipped: 0, pending: 0 })
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ totalLegacy: 0, totalMigrated: 0, remaining: 0 })
  const [batchSize, setBatchSize] = useState(10)
  const [retryFailed, setRetryFailed] = useState(false)
  const [dryRun, setDryRun] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load initial stats
  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/migrate-batch')
      const data = await response.json()
      
      if (data.success) {
        setDashboardStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const startMigration = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setResults([])

    try {
      const response = await fetch('/api/migrate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize,
          retryFailed,
          dryRun
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.results || [])
        setStats(data.stats || { total: 0, migrated: 0, failed: 0, skipped: 0, pending: 0 })
        setSuccess(data.message)
        
        // Reload stats
        await loadStats()
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      migrated: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredResults = results.filter(result => {
    if (retryFailed) return result.status === 'failed'
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Migration Dashboard</h1>
          <p className="text-gray-600">Migrate legacy users from MySQL to Supabase Auth</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Legacy Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardStats.totalLegacy}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Already Migrated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dashboardStats.totalMigrated}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dashboardStats.remaining}</div>
            </CardContent>
          </Card>
        </div>

        {/* Migration Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Migration Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchSize">Batch Size</Label>
                <Input
                  id="batchSize"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                  min="1"
                  max="50"
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">Number of users to process in parallel (1-50)</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retryFailed"
                  checked={retryFailed}
                  onCheckedChange={(checked) => setRetryFailed(checked as boolean)}
                />
                <Label htmlFor="retryFailed">Retry Failed Only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dryRun"
                  checked={dryRun}
                  onCheckedChange={(checked) => setDryRun(checked as boolean)}
                />
                <Label htmlFor="dryRun">Dry Run (No Changes)</Label>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={startMigration}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Migrating...' : 'Start Migration'}
              </Button>
              
              <Button
                onClick={loadStats}
                variant="outline"
                disabled={isLoading}
              >
                Refresh Stats
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 font-medium">Success:</p>
                <p className="text-green-700">{success}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Migration Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Migration Results</CardTitle>
              <div className="flex space-x-4 text-sm">
                <span className="text-green-600">✅ Migrated: {stats.migrated}</span>
                <span className="text-red-600">❌ Failed: {stats.failed}</span>
                <span className="text-gray-600">⏭️ Skipped: {stats.skipped}</span>
                <span className="text-yellow-600">⏳ Pending: {stats.pending}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Auth User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResults.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(result.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.auth_user_id ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {result.auth_user_id.substring(0, 8)}...
                            </code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {result.error ? (
                            <span className="text-red-600 text-xs">{result.error}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
