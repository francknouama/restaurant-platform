import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon } from '@heroicons/react/24/outline'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">Page not found</h2>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center px-6 py-3"
          >
            <HomeIcon className="h-5 w-5 mr-2" />
            Go back home
          </Link>
          
          <div className="text-sm text-gray-500">
            Or go back to the{' '}
            <Link to="/dashboard" className="text-primary-600 hover:text-primary-500 font-medium">
              dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}