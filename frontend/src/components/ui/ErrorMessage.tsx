import React from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorMessageProps {
  title?: string
  message: string
  className?: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Error',
  message,
  className = '',
}) => {
  return (
    <div className={`flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
    </div>
  )
}