import React from 'react'
import { Link } from 'react-router-dom'
import { 
  RocketLaunchIcon, 
  ShieldCheckIcon, 
  CpuChipIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: ClipboardDocumentListIcon,
      title: 'Task Management',
      description: 'Create, assign, and track tasks with priority levels and due dates for efficient project management.',
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Monitor system performance, task completion rates, and user activity with live metrics.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Authentication',
      description: 'JWT-based authentication with role-based access control and secure token management.',
    },
    {
      icon: CpuChipIcon,
      title: 'Go Microservices',
      description: 'Scalable backend architecture with Go microservices for high performance and reliability.',
    },
    {
      icon: UsersIcon,
      title: 'User Management',
      description: 'Comprehensive user profiles, role management, and team collaboration features.',
    },
    {
      icon: RocketLaunchIcon,
      title: 'Modern Architecture',
      description: 'Built with React 18, TypeScript, and modern development practices for optimal performance.',
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
              TaskFlow
              <span className="block text-accent-400">Management System</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              A comprehensive task management application with Go microservices backend, 
              real-time analytics, and modern React frontend.
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
              Powerful Features for Modern Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge technologies to deliver exceptional 
              performance and user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Tech Stack Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built with Modern Technologies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Leveraging the best tools and frameworks for scalable, 
              maintainable applications.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'React 18', description: 'Modern UI Framework' },
              { name: 'TypeScript', description: 'Type Safety' },
              { name: 'Go', description: 'Backend Services' },
              { name: 'Tailwind CSS', description: 'Utility-First CSS' },
            ].map((tech, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {tech.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                <p className="text-sm text-gray-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join teams who are already using TaskFlow to manage their projects 
            more efficiently and deliver better results.
          </p>
          <Link
            to="/register"
            className="btn bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 text-lg font-semibold"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  )
}