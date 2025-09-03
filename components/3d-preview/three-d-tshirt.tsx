'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useAnalytics } from '@/lib/analytics'

interface ThreeDTShirtProps {
  designImageUrl?: string
  color?: string
  logoImageUrl?: string
  className?: string
}

// T-Shirt colors configuration
const T_SHIRT_COLORS = {
  white: '#ffffff',
  black: '#1a1a1a', 
  navy: '#1e40af',
  gray: '#6b7280',
  red: '#dc2626',
  green: '#16a34a',
  blue: '#2563eb',
  purple: '#7c3aed'
}

function TShirtMesh({ 
  color = 'white', 
  designTexture, 
  logoTexture 
}: { 
  color: string
  designTexture?: THREE.Texture
  logoTexture?: THREE.Texture
}) {
  const meshRef = useRef<THREE.Group>(null)
  const fabricRef = useRef<THREE.Mesh>(null)
  
  // Create t-shirt geometry using shapes
  const createTShirtGeometry = () => {
    // Create the main body shape
    const bodyShape = new THREE.Shape()
    
    // T-shirt outline (front view)
    bodyShape.moveTo(-1.2, 1.5)      // Top left shoulder
    bodyShape.lineTo(-0.4, 1.5)      // Shoulder to neck
    bodyShape.quadraticCurveTo(-0.2, 1.7, 0, 1.7)  // Neck curve left
    bodyShape.quadraticCurveTo(0.2, 1.7, 0.4, 1.5)  // Neck curve right
    bodyShape.lineTo(1.2, 1.5)       // Neck to right shoulder
    bodyShape.lineTo(1.2, 0.8)       // Right shoulder down
    bodyShape.lineTo(0.8, 0.8)       // Armpit
    bodyShape.lineTo(0.8, -1.5)      // Right side down
    bodyShape.lineTo(-0.8, -1.5)     // Bottom
    bodyShape.lineTo(-0.8, 0.8)      // Left side up
    bodyShape.lineTo(-1.2, 0.8)      // Left armpit
    bodyShape.closePath()
    
    // Extrude the shape to create 3D t-shirt
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 4,
      bevelSize: 0.02,
      bevelThickness: 0.02
    }
    
    return new THREE.ExtrudeGeometry(bodyShape, extrudeSettings)
  }

  // Create sleeve geometry
  const createSleeveGeometry = () => {
    const sleeveShape = new THREE.Shape()
    sleeveShape.moveTo(0, 0)
    sleeveShape.lineTo(0.4, 0)
    sleeveShape.lineTo(0.5, -0.6)
    sleeveShape.lineTo(0.1, -0.8)
    sleeveShape.lineTo(-0.1, -0.6)
    sleeveShape.closePath()
    
    return new THREE.ExtrudeGeometry(sleeveShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.01,
      bevelThickness: 0.01
    })
  }

  const tshirtGeometry = createTShirtGeometry()
  const sleeveGeometry = createSleeveGeometry()
  
  // Create fabric material
  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: T_SHIRT_COLORS[color as keyof typeof T_SHIRT_COLORS] || T_SHIRT_COLORS.white,
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.95
  })

  // Animation
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const time = state.clock.getElapsedTime()
      meshRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.005)
      
      // Slight rotation for dynamic feel
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.02
    }
  })

  return (
    <group ref={meshRef}>
      {/* Main T-Shirt Body */}
      <mesh 
        ref={fabricRef}
        geometry={tshirtGeometry} 
        material={fabricMaterial}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        {/* Front Design */}
        {designTexture && (
          <mesh position={[0, 0.2, 0.051]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshBasicMaterial 
              map={designTexture} 
              transparent 
              alphaTest={0.1}
              toneMapped={false}
            />
          </mesh>
        )}
        
        {/* Back Logo */}
        {logoTexture && (
          <mesh position={[0, 1.2, -0.051]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial 
              map={logoTexture} 
              transparent 
              alphaTest={0.1}
              toneMapped={false}
            />
          </mesh>
        )}
      </mesh>
      
      {/* Left Sleeve */}
      <mesh 
        geometry={sleeveGeometry}
        material={fabricMaterial}
        position={[-1.2, 1.1, 0]}
        rotation={[0, 0, 0]}
        castShadow
      />
      
      {/* Right Sleeve */}
      <mesh 
        geometry={sleeveGeometry}
        material={fabricMaterial}
        position={[1.2, 1.1, 0]}
        rotation={[0, 0, Math.PI]}
        castShadow
      />
    </group>
  )
}

function Scene({ 
  color, 
  designImageUrl, 
  logoImageUrl 
}: { 
  color: string
  designImageUrl?: string
  logoImageUrl?: string
}) {
  const [designTexture, setDesignTexture] = useState<THREE.Texture | undefined>()
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | undefined>()
  const [loading, setLoading] = useState(false)
  
  // Load design texture
  useEffect(() => {
    if (designImageUrl) {
      setLoading(true)
      const loader = new THREE.TextureLoader()
      loader.load(
        designImageUrl,
        (texture) => {
          texture.flipY = false
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          setDesignTexture(texture)
          setLoading(false)
        },
        undefined,
        (error) => {
          console.error('Error loading design texture:', error)
          setLoading(false)
        }
      )
    }
  }, [designImageUrl])

  // Load logo texture
  useEffect(() => {
    if (logoImageUrl) {
      const loader = new THREE.TextureLoader()
      loader.load(
        logoImageUrl,
        (texture) => {
          texture.flipY = false
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          setLogoTexture(texture)
        },
        undefined,
        (error) => {
          console.error('Error loading logo texture:', error)
        }
      )
    }
  }, [logoImageUrl])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight 
        position={[-10, 5, 5]} 
        intensity={0.3}
      />
      
      {/* T-Shirt */}
      <TShirtMesh 
        color={color} 
        designTexture={designTexture}
        logoTexture={logoTexture}
      />
      
      {/* Ground shadow */}
      <ContactShadows 
        position={[0, -1.8, 0]} 
        opacity={0.3} 
        scale={6} 
        blur={2.5} 
      />
      
      {/* Environment */}
      <Environment preset="studio" />
      
      {/* Loading indicator */}
      {loading && (
        <Html position={[0, -2.5, 0]} center>
          <div className="bg-white bg-opacity-90 rounded-lg p-3 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-gray-700">Loading design...</span>
          </div>
        </Html>
      )}
    </>
  )
}

function CameraControls() {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)
  }, [camera])
  
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={8}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI - Math.PI / 6}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      autoRotate={false}
      autoRotateSpeed={1}
    />
  )
}

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading 3D Preview...</p>
        <p className="text-gray-500 text-sm mt-1">Preparing your design</p>
      </div>
    </div>
  )
}

function ErrorFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
      <div className="text-center">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-700 font-medium">3D Preview Unavailable</p>
        <p className="text-red-600 text-sm mt-1">Using fallback preview</p>
      </div>
    </div>
  )
}

export default function ThreeDTShirt({ 
  designImageUrl, 
  color = 'white',
  logoImageUrl,
  className = ''
}: ThreeDTShirtProps) {
  const [hasError, setHasError] = useState(false)
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    // Track 3D preview view
    trackEvent({
      action: '3d_preview_viewed',
      category: 'engagement',
      custom_parameters: {
        product_type: 'tshirt',
        color: color,
        has_design: !!designImageUrl
      }
    })
  }, [designImageUrl, color, trackEvent])

  const handleInteraction = (action: string) => {
    trackEvent({
      action: '3d_preview_interaction',
      category: 'engagement',
      custom_parameters: {
        interaction_type: action,
        product_type: 'tshirt'
      }
    })
  }

  if (hasError) {
    return <ErrorFallback />
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            shadows
            camera={{ position: [0, 0, 4], fov: 50 }}
            onCreated={() => setHasError(false)}
            onError={() => setHasError(true)}
            gl={{ 
              antialias: true, 
              alpha: true,
              preserveDrawingBuffer: true 
            }}
            dpr={[1, 2]}
          >
            <Scene 
              color={color} 
              designImageUrl={designImageUrl}
              logoImageUrl={logoImageUrl}
            />
            <CameraControls />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>Drag to rotate</span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>Scroll to zoom</span>
          </div>
        </div>
      </div>

      {/* Quality badge */}
      <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
        3D Preview • High Quality
      </div>
      
      {/* Product info */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-lg">
        T-Shirt • {color.charAt(0).toUpperCase() + color.slice(1)}
      </div>
    </div>
  )
}