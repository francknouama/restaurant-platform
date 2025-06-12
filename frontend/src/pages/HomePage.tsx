import React from 'react'
import { Link } from 'react-router-dom'
import { 
  RocketLaunchIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline'

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: RocketLaunchIcon,
      title: 'Modern Architecture',
      description: 'Built with React 18, TypeScript, and modern development practices for optimal performance.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Authentication',
      description: 'JWT-based authentication with protected routes and secure token management.',
    },
    {
      icon: CpuChipIcon,
      title: 'Micro-Frontend Ready',
      description: 'Scalable architecture supporting micro-frontend patterns and module federation.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Modern Frontend
              <span className="block text-accent-400">Application</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              A comprehensive React application with TypeScript, modern UI components, 
              and scalable architecture ready for production.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 text-lg font-semibold"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link
                to="/login"
                className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3 text-lg font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with modern technologies and best practices to deliver 
              exceptional user experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card hover:shadow-lg transition-shadow duration-300 animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers who are building amazing applications 
            with our modern frontend platform.
          </p>
          <Link
            to="/register"
            className="btn btn-primary px-8 py-3 text-lg font-semibold"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  )
}