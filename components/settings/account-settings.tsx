'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import {
  Eye,
  EyeOff,
  Save,
  X,
  Key,
  Mail,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface User {
  id: string
  email?: string
  emailVerified?: Date | null
  createdAt: Date
  updatedAt: Date
}

interface AccountSettingsProps {
  user: User
}

export default function AccountSettings({ user }: AccountSettingsProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: '',
  })

  const { data: session } = useSession()
  const router = useRouter()
  const { trackEvent } = useAnalytics()

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change password')
      }

      trackEvent({
        action: 'password_changed',
        category: 'security',
      })

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsChangingPassword(false)
      alert('Password changed successfully')
    } catch (error) {
      console.error('Failed to change password:', error)
      alert(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailChange = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/user/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newEmail: emailData.newEmail,
          password: emailData.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change email')
      }

      trackEvent({
        action: 'email_change_requested',
        category: 'account',
      })

      setEmailData({ newEmail: '', password: '' })
      setIsChangingEmail(false)
      alert('Email change requested. Please check both your old and new email for verification instructions.')
    } catch (error) {
      console.error('Failed to change email:', error)
      alert(error instanceof Error ? error.message : 'Failed to change email')
    } finally {
      setSaving(false)
    }
  }

  const handleResendVerification = async () => {
    setIsVerifyingEmail(true)

    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      trackEvent({
        action: 'email_verification_resent',
        category: 'account',
      })

      alert('Verification email sent! Please check your inbox.')
    } catch (error) {
      console.error('Failed to send verification email:', error)
      alert('Failed to send verification email. Please try again.')
    } finally {
      setIsVerifyingEmail(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: 'text-red-600' }
      case 2:
        return { label: 'Weak', color: 'text-orange-600' }
      case 3:
        return { label: 'Fair', color: 'text-yellow-600' }
      case 4:
        return { label: 'Good', color: 'text-blue-600' }
      case 5:
        return { label: 'Strong', color: 'text-green-600' }
      default:
        return { label: '', color: '' }
    }
  }

  return (
    <div className="space-y-8">
      {/* Email Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Mail className="h-5 w-5 text-gray-400" />
          <span>Email Address</span>
        </h3>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                {user.emailVerified ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-600">Unverified</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!user.emailVerified && (
                <button
                  onClick={handleResendVerification}
                  disabled={isVerifyingEmail}
                  className="btn-secondary text-sm"
                >
                  {isVerifyingEmail ? 'Sending...' : 'Verify Email'}
                </button>
              )}
              <button
                onClick={() => setIsChangingEmail(true)}
                className="btn-secondary text-sm"
              >
                Change Email
              </button>
            </div>
          </div>

          {isChangingEmail && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={emailData.newEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                  className="input"
                  placeholder="Enter new email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                  className="input"
                  placeholder="Enter your current password"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleEmailChange}
                  disabled={isSaving || !emailData.newEmail || !emailData.password}
                  className="btn-primary text-sm"
                >
                  {isSaving ? 'Changing...' : 'Change Email'}
                </button>
                <button
                  onClick={() => {
                    setIsChangingEmail(false)
                    setEmailData({ newEmail: '', password: '' })
                  }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Key className="h-5 w-5 text-gray-400" />
          <span>Password</span>
        </h3>

        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-600">
                Last changed on {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn-secondary text-sm"
            >
              Change Password
            </button>
          </div>

          {isChangingPassword && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="input pr-10"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="input"
                  placeholder="Enter new password"
                />
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            getPasswordStrength(passwordData.newPassword) <= 2 ? 'bg-red-500' :
                            getPasswordStrength(passwordData.newPassword) === 3 ? 'bg-yellow-500' :
                            getPasswordStrength(passwordData.newPassword) === 4 ? 'bg-blue-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(getPasswordStrength(passwordData.newPassword) / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${getPasswordStrengthLabel(getPasswordStrength(passwordData.newPassword)).color}`}>
                        {getPasswordStrengthLabel(getPasswordStrength(passwordData.newPassword)).label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input"
                  placeholder="Confirm new password"
                />
                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={passwordData.newPassword.length >= 8 ? 'text-green-600' : ''}>
                    • At least 8 characters long
                  </li>
                  <li className={/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                    • Contains an uppercase letter
                  </li>
                  <li className={/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                    • Contains a lowercase letter
                  </li>
                  <li className={/[0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                    • Contains a number
                  </li>
                  <li className={/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'text-green-600' : ''}>
                    • Contains a special character
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    isSaving || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    getPasswordStrength(passwordData.newPassword) < 3
                  }
                  className="btn-primary text-sm"
                >
                  {isSaving ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setIsChangingPassword(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-400" />
          <span>Account Information</span>
        </h3>

        <div className="grid grid-cols-1 gap-4
                        sm:grid-cols-2">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Member Since</h4>
            <p className="text-sm text-gray-600">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Last Updated</h4>
            <p className="text-sm text-gray-600">
              {new Date(user.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">2FA Status</p>
              <p className="text-sm text-gray-600">
                Two-factor authentication is not enabled
              </p>
            </div>
            <button className="btn-primary text-sm">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}