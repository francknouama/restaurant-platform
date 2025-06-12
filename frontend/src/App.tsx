import React from 'react'
import { Routes, Route } from 'react-router-dom'

import { Layout } from '@components/layout/Layout'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'

// Pages
import { HomePage } from '@pages/HomePage'
import { LoginPage } from '@pages/auth/LoginPage'
import { RegisterPage } from '@pages/auth/RegisterPage'
import { DashboardPage } from '@pages/DashboardPage'
import { ProfilePage } from '@pages/ProfilePage'
import { TasksPage } from '@pages/TasksPage'
import { NotFoundPage } from '@pages/NotFoundPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="tasks" element={<TasksPage />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App