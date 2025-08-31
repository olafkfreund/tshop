import Link from 'next/link'
import Header from '@/components/navigation/header'
import { Shirt, Crown, ShoppingBag } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative bg-gradient-to-b from-primary-50 to-white py-20
                          md:py-32">
          <div className="container mx-auto px-4
                          sm:px-6
                          lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900
                            sm:text-6xl">
                AI-Powered Custom Apparel
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600
                            sm:text-xl">
                Create professional-quality personalized t-shirts, caps, and tote bags 
                with instant AI design generation and integrated fulfillment.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link 
                  href="/design" 
                  className="btn-primary text-base px-6 py-3
                            hover:bg-primary-600
                            focus-visible:ring-primary-600"
                >
                  Start Designing
                </Link>
                <Link 
                  href="/products" 
                  className="btn-ghost text-base px-6 py-3"
                >
                  View Products
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4
                          sm:px-6
                          lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900
                            sm:text-4xl">
                Everything you need to create amazing apparel
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Professional design tools powered by AI, with seamless fulfillment
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8
                            sm:grid-cols-2
                            lg:grid-cols-3">
              <div className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  AI Design Generation
                </h3>
                <p className="mt-2 text-gray-600">
                  Create professional designs instantly with AI-powered generation tailored for apparel.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  3D Preview System
                </h3>
                <p className="mt-2 text-gray-600">
                  See your designs in realistic 3D with interactive rotation and high-quality rendering.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0V8.25a1.5 1.5 0 113 0v10.5zM12.75 18.75a1.5 1.5 0 01-3 0V8.25a1.5 1.5 0 113 0v10.5zM17.25 18.75a1.5 1.5 0 01-3 0V8.25a1.5 1.5 0 113 0v10.5z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Integrated Fulfillment
                </h3>
                <p className="mt-2 text-gray-600">
                  Seamless printing and shipping with premium and cost-effective options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Types Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4
                          sm:px-6
                          lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900
                            sm:text-4xl">
                Premium Products
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                High-quality apparel perfect for your custom designs
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8
                            sm:grid-cols-2
                            lg:grid-cols-3">
              <div className="card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-coral-100 to-coral-200 flex items-center justify-center">
                  <div className="w-24 h-32 bg-white rounded-lg shadow-md flex items-center justify-center">
                    <Shirt className="h-12 w-12 text-coral-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">T-Shirts</h3>
                  <p className="mt-2 text-gray-600">Premium cotton tees with perfect fit</p>
                  <div className="mt-4">
                    <Link href="/products/t-shirts" className="btn-primary">
                      Design Now
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center">
                    <Crown className="h-10 w-10 text-blue-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">Caps</h3>
                  <p className="mt-2 text-gray-600">Adjustable caps with AR try-on</p>
                  <div className="mt-4">
                    <Link href="/products/caps" className="btn-primary">
                      Design Now
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <div className="w-28 h-32 bg-white rounded-lg shadow-md flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-green-500" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">Tote Bags</h3>
                  <p className="mt-2 text-gray-600">Eco-friendly canvas totes</p>
                  <div className="mt-4">
                    <Link href="/products/tote-bags" className="btn-primary">
                      Design Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-12
                        sm:px-6
                        lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold">TShop</h3>
            <p className="mt-2 text-gray-400">
              AI-Powered Custom Apparel Platform
            </p>
            <div className="mt-8 flex justify-center space-x-6">
              <Link href="/about" className="text-gray-400 hover:text-white">
                About
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms
              </Link>
            </div>
            <div className="mt-8 text-sm text-gray-400">
              © 2025 TShop. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}