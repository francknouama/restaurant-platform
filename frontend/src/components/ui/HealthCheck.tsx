import React from 'react'
import { useQuery } from 'react-query'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { healthApi } from '@api/health'
import { HealthCheckResponse } from '@types/index'

interface HealthCheckProps {
  className?: string
  showDetails?: boolean
}

export const HealthCheck: React.FC<HealthCheckProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const { data, isLoading, error } = useQuery<{ data: HealthCheckResponse }>(
    ['health'],
    healthApi.checkHealth,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      retry: 1,
    }
  )

  const healthData = data?.data

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <ClockIcon className="h-4 w-4 text-yellow-500 animate-spin" />
        <span className="text-sm text-gray-600">Checking health...</span>
      </div>
    )
  }

  if (error || !healthData) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <XCircleIcon className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">Service unavailable</span>
      </div>
    )
  }

  const isHealthy = healthData.status === 'healthy'

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2">
        {isHealthy ? (
          <CheckCircleIcon className="h-4 w-4 text-green-500" />
        ) : (
          <XCircleIcon className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
          {isHealthy ? 'All systems operational' : 'Service issues detected'}
        </span>
      </div>

      {showDetails && healthData.services && (
        <div className="mt-2 space-y-1">
          {Object.entries(healthData.services).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{service}</span>
              <div className="flex items-center space-x-1">
                {status.status === 'up' ? (
                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircleIcon className="h-3 w-3 text-red-500" />
                )}
                <span className={status.status === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {status.status}
                </span>
                {status.response_time && (
                  <span className="text-gray-500">({status.response_time})</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}