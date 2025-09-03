import { WifiOff, RefreshCw, Home, ShoppingBag } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Offline Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <WifiOff className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            You're Offline
          </h1>
          
          <p className="text-gray-600 mb-8">
            It looks like you've lost your internet connection. Don't worry, 
            you can still browse your saved designs and continue working on them.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </button>
          </div>

          {/* Offline Features */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              What you can still do offline:
            </h3>
            
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  View your saved designs
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Continue editing existing designs
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Browse cached product pages
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  New AI generations require internet
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  Placing orders requires internet
                </span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              We'll automatically sync your changes when you're back online
            </p>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-400">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm">TShop PWA</span>
          </div>
        </div>
      </div>
    </div>
  )
}