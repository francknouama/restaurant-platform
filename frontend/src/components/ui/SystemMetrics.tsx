import React from 'react'
import { useQuery } from 'react-query'
import { 
  CpuChipIcon, 
  ServerIcon, 
  ClockIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'
import { metricsApi } from '@api/metrics'
import { LoadingSpinner } from './LoadingSpinner'

interface SystemMetricsProps {
  className?: string
  showDetails?: boolean
}

export const SystemMetrics: React.FC<SystemMetricsProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const { data: metricsData, isLoading } = useQuery(
    ['metrics', 'performance'],
    metricsApi.getPerformanceMetrics,
    {
      refetchInterval: 10000, // Refetch every 10 seconds
      retry: 1,
    }
  )

  const { data: systemInfo } = useQuery(
    ['system', 'info'],
    metricsApi.getSystemInfo,
    {
      staleTime: 300000, // 5 minutes
      retry: 1,
    }
  )

  const metrics = metricsData?.data
  const info = systemInfo?.data

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className={`card ${className}`}>
        <div className="text-center py-8">
          <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Metrics unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
        {info && (
          <div className="text-sm text-gray-500">
            v{info.version} • {info.go_version}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.requests_per_second.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">RPS</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
            <ClockIcon className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.average_response_time.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600">Avg Response</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
            <CpuChipIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.goroutines}
          </div>
          <div className="text-sm text-gray-600">Goroutines</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
            <ServerIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {(metrics.error_rate * 100).toFixed(2)}%
          </div>
          <div className="text-sm text-gray-600">Error Rate</div>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Memory Usage</span>
              <span className="text-gray-900">{metrics.memory_usage.allocated}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: '65%' }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Active Connections:</span>
              <span className="ml-2 font-medium text-gray-900">
                {metrics.active_connections}
              </span>
            </div>
            <div>
              <span className="text-gray-600">GC Runs:</span>
              <span className="ml-2 font-medium text-gray-900">
                {metrics.memory_usage.gc_runs}
              </span>
            </div>
          </div>

          {info && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Uptime:</span>
                  <span className="ml-2 font-medium text-gray-900">{info.uptime}</span>
                </div>
                <div>
                  <span className="text-gray-600">Build:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {info.git_commit?.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}