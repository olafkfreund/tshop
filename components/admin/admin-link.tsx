'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Crown } from 'lucide-react'

export default function AdminLink() {
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      // Check if user is admin
      fetch('/api/admin/check')
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.isAdmin)
          setLoading(false)
        })
        .catch(() => {
          setIsAdmin(false)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [session])

  if (loading || !isAdmin) return null

  return (
    <Link
      href="/admin"
      className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium"
    >
      <Crown className="h-4 w-4 inline mr-2" />
      Admin Panel
    </Link>
  )
}