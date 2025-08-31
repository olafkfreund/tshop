'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAnalytics } from '@/lib/analytics'
import {
  Camera,
  Save,
  X,
  Upload,
  User,
  Mail,
  Globe,
  Instagram,
  Twitter,
  Github
} from 'lucide-react'

interface User {
  id: string
  name?: string
  email?: string
  image?: string
  bio?: string
  location?: string
  website?: string
  socialLinks?: any
  isPublicProfile?: boolean
}

interface ProfileSettingsProps {
  user: User
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    socialLinks: {
      twitter: user.socialLinks?.twitter || '',
      instagram: user.socialLinks?.instagram || '',
      github: user.socialLinks?.github || '',
    },
    isPublicProfile: user.isPublicProfile ?? true,
  })

  const { data: session, update } = useSession()
  const router = useRouter()
  const { trackEvent } = useAnalytics()

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value as string,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image must be smaller than 5MB')
      return
    }

    setImageUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const { imageUrl } = await response.json()

      // Update session
      await update({ image: imageUrl })
      
      trackEvent({
        action: 'profile_image_updated',
        category: 'profile',
        custom_parameters: {
          file_size: file.size,
          file_type: file.type,
        },
      })

      // Refresh the page to show new image
      router.refresh()
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      // Update session if name changed
      if (formData.name !== user.name) {
        await update({ name: formData.name })
      }

      trackEvent({
        action: 'profile_updated',
        category: 'profile',
        custom_parameters: {
          fields_updated: Object.keys(formData).filter(
            key => formData[key as keyof typeof formData] !== (user as any)[key]
          ),
        },
      })

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      socialLinks: {
        twitter: user.socialLinks?.twitter || '',
        instagram: user.socialLinks?.instagram || '',
        github: user.socialLinks?.github || '',
      },
      isPublicProfile: user.isPublicProfile ?? true,
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
            {user.image ? (
              <img
                src={user.image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Upload Overlay */}
          <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={imageUploading}
            />
            {imageUploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </label>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
          <p className="text-sm text-gray-600">
            Upload a new profile picture. JPG, PNG or GIF. Max size 5MB.
          </p>
          <label className="mt-2 btn-secondary text-sm cursor-pointer inline-flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload New Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={imageUploading}
            />
          </label>
        </div>
      </div>

      {/* Profile Form */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="input"
              placeholder="Enter your display name"
            />
          ) : (
            <p className="py-2 px-3 bg-gray-50 rounded-lg text-gray-900">
              {user.name || 'Not set'}
            </p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <p className="py-2 px-3 bg-gray-50 rounded-lg text-gray-900 flex-1">
              {user.email}
            </p>
            <span className="text-xs text-gray-500">Verified</span>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="input"
              placeholder="Tell us a bit about yourself..."
              maxLength={500}
            />
          ) : (
            <p className="py-2 px-3 bg-gray-50 rounded-lg text-gray-900 min-h-20">
              {user.bio || 'No bio provided'}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="input"
              placeholder="City, Country"
            />
          ) : (
            <p className="py-2 px-3 bg-gray-50 rounded-lg text-gray-900">
              {user.location || 'Not specified'}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          {isEditing ? (
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="input flex-1"
                placeholder="https://your-website.com"
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-400" />
              {user.website ? (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  {user.website}
                </a>
              ) : (
                <p className="text-gray-500">Not provided</p>
              )}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Social Links
          </label>
          <div className="space-y-3">
            {/* Twitter */}
            <div className="flex items-center space-x-3">
              <Twitter className="h-5 w-5 text-blue-400" />
              {isEditing ? (
                <input
                  type="text"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                  className="input flex-1"
                  placeholder="@username"
                />
              ) : (
                <p className="text-gray-900">
                  {user.socialLinks?.twitter ? `@${user.socialLinks.twitter}` : 'Not connected'}
                </p>
              )}
            </div>

            {/* Instagram */}
            <div className="flex items-center space-x-3">
              <Instagram className="h-5 w-5 text-pink-500" />
              {isEditing ? (
                <input
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                  className="input flex-1"
                  placeholder="@username"
                />
              ) : (
                <p className="text-gray-900">
                  {user.socialLinks?.instagram ? `@${user.socialLinks.instagram}` : 'Not connected'}
                </p>
              )}
            </div>

            {/* GitHub */}
            <div className="flex items-center space-x-3">
              <Github className="h-5 w-5 text-gray-800" />
              {isEditing ? (
                <input
                  type="text"
                  value={formData.socialLinks.github}
                  onChange={(e) => handleInputChange('socialLinks.github', e.target.value)}
                  className="input flex-1"
                  placeholder="username"
                />
              ) : (
                <p className="text-gray-900">
                  {user.socialLinks?.github ? `${user.socialLinks.github}` : 'Not connected'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Public Profile Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Public Profile</h4>
            <p className="text-sm text-gray-600">
              Allow others to see your profile and designs in the community gallery
            </p>
          </div>
          {isEditing ? (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublicProfile}
                onChange={(e) => handleInputChange('isPublicProfile', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          ) : (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              user.isPublicProfile 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.isPublicProfile ? 'Public' : 'Private'}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        {isEditing ? (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-primary"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  )
}