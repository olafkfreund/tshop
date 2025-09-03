'use client'

import { useState } from 'react'
import { Crown, User, Loader } from 'lucide-react'

interface UserRoleButtonProps {
  userId: string
  currentRole: string
  disabled?: boolean
}

export default function UserRoleButton({ userId, currentRole, disabled = false }: UserRoleButtonProps) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const handleRoleChange = async (newRole: string) => {
    if (disabled || loading || newRole === role) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole
        })
      })

      if (response.ok) {
        setRole(newRole)
        // Refresh the page to show updated role
        window.location.reload()
      } else {
        console.error('Failed to update role')
        alert('Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Error updating user role')
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <span className=\"text-sm text-gray-500 italic\">
        (Current user)
      </span>
    )
  }

  return (
    <div className=\"flex space-x-2\">
      {loading ? (
        <div className=\"flex items-center text-gray-500\">
          <Loader className=\"h-4 w-4 animate-spin mr-1\" />
          <span className=\"text-sm\">Updating...</span>
        </div>
      ) : (
        <>
          <button
            onClick={() => handleRoleChange('user')}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              role === 'user'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className=\"h-3 w-3 mr-1\" />
            User
          </button>
          <button
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center px-3 py-1 rounded-md text-sm transition-colors ${
              role === 'admin'
                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                : 'text-purple-600 hover:bg-purple-100'
            }`}
          >
            <Crown className=\"h-3 w-3 mr-1\" />
            Admin
          </button>
        </>
      )}
    </div>
  )
}