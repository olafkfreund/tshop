import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Header from '@/components/navigation/header'
import ProfileSettings from '@/components/settings/profile-settings'
import AccountSettings from '@/components/settings/account-settings'
import NotificationSettings from '@/components/settings/notification-settings'
import PrivacySettings from '@/components/settings/privacy-settings'
import {
  ArrowLeft,
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

async function getUserSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          orders: true,
          designs: true,
        },
      },
    },
  })

  return user
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await getUserSettings(session.user.id!)
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8
                      sm:px-6
                      lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and personal information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8
                        lg:grid-cols-4">
          
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <nav className="space-y-1">
                <a
                  href="#profile"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700"
                >
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </a>
                <a
                  href="#account"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Settings className="h-5 w-5" />
                  <span>Account</span>
                </a>
                <a
                  href="#notifications"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </a>
                <a
                  href="#privacy"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <Shield className="h-5 w-5" />
                  <span>Privacy</span>
                </a>
                <a
                  href="#addresses"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <MapPin className="h-5 w-5" />
                  <span>Addresses</span>
                </a>
                <Link
                  href="/dashboard/billing"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Billing</span>
                </Link>
              </nav>

              {/* Account Stats */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Account Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Orders</span>
                    <span className="font-medium text-gray-900">{user._count.orders}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Designs</span>
                    <span className="font-medium text-gray-900">{user._count.designs}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium text-gray-900">
                      {new Date(user.createdAt).getFullYear()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Profile Settings */}
            <section id="profile">
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <User className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                </div>
                <ProfileSettings user={user} />
              </div>
            </section>

            {/* Account Settings */}
            <section id="account">
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
                </div>
                <AccountSettings user={user} />
              </div>
            </section>

            {/* Notification Settings */}
            <section id="notifications">
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Bell className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
                </div>
                <NotificationSettings user={user} />
              </div>
            </section>

            {/* Privacy Settings */}
            <section id="privacy">
              <div className="card p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
                </div>
                <PrivacySettings user={user} />
              </div>
            </section>

            {/* Addresses */}
            <section id="addresses">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                  </div>
                  <button className="btn-primary text-sm">
                    Add Address
                  </button>
                </div>
                
                {user.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No saved addresses yet</p>
                    <button className="btn-secondary mt-4">
                      Add Your First Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.addresses.map((address, index) => (
                      <div
                        key={address.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">
                                {address.firstName} {address.lastName}
                              </h3>
                              {address.isDefault && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {address.company && <p>{address.company}</p>}
                              <p>{address.address1}</p>
                              {address.address2 && <p>{address.address2}</p>}
                              <p>
                                {address.city}, {address.state} {address.postalCode}
                              </p>
                              <p>{address.country}</p>
                              {address.phone && <p>{address.phone}</p>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="text-sm text-primary-600 hover:text-primary-700">
                              Edit
                            </button>
                            <button className="text-sm text-red-600 hover:text-red-700">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <div className="card p-6 border-red-200">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-red-900">Delete Account</h3>
                      <p className="text-sm text-red-700">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <button className="btn text-sm bg-red-600 text-white hover:bg-red-700">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}