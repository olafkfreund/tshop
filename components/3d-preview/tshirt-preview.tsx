'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '@/lib/constants'

interface TShirtPreviewProps {
  designImageUrl?: string
  color?: string
  style?: 'regular' | 'slim' | 'oversized'
  showControls?: boolean
  autoRotate?: boolean
}

function TShirtModel({ designImageUrl, color = '#FFFFFF', style = 'regular' }: {
  designImageUrl?: string
  color: string
  style: 'regular' | 'slim' | 'oversized'
}) {
  const groupRef = useRef<THREE.Group>(null)
  const designRef = useRef<THREE.Mesh>(null)
  
  // Load design texture
  const designTexture = useLoader(
    THREE.TextureLoader,
    designImageUrl || '/images/placeholder-design.svg',
    (loader) => {
      // Handle CORS for external images
      loader.crossOrigin = 'anonymous'
    }
  )

  useEffect(() => {
    if (designTexture) {
      designTexture.flipY = false
      designTexture.wrapS = THREE.ClampToEdgeWrapping
      designTexture.wrapT = THREE.ClampToEdgeWrapping
    }
  }, [designTexture])

  // Animate rotation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  // T-shirt geometry based on style
  const getGeometryScale = () => {
    switch (style) {
      case 'slim': return [0.9, 1, 0.95]
      case 'oversized': return [1.2, 1.1, 1.1]
      default: return [1, 1, 1]
    }
  }

  const [scaleX, scaleY, scaleZ] = getGeometryScale()

  return (
    <group ref={groupRef} scale={[scaleX, scaleY, scaleZ]}>
      {/* Main T-shirt body - simplified plane approach */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.2, 2.8, 10, 10]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Left Sleeve */}
      <mesh position={[-1.3, 0.3, -0.05]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.8, 1.2, 5, 5]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Right Sleeve */}
      <mesh position={[1.3, 0.3, -0.05]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.8, 1.2, 5, 5]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Collar */}
      <mesh position={[0, 1.3, 0.02]}>
        <ringGeometry args={[0.25, 0.4, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Design overlay on front */}
      {designImageUrl && (
        <mesh 
          ref={designRef} 
          position={[0, 0, 0.05]} 
          scale={[0.8, 0.8, 1]}
        >
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial
            map={designTexture}
            transparent
            alphaTest={0.1}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      )}
    </group>
  )
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading 3D preview...</p>
      </div>
    </div>
  )
}

export default function TShirtPreview({ 
  designImageUrl, 
  color = '#FFFFFF', 
  style = 'regular',
  showControls = true,
  autoRotate = true
}: TShirtPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] bg-gray-50 rounded-lg">
        <LoadingFallback />
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Environment */}
        <Environment preset="studio" />
        
        {/* T-shirt Model */}
        <Suspense fallback={null}>
          <TShirtModel 
            designImageUrl={designImageUrl}
            color={color}
            style={style}
          />
        </Suspense>
        
        {/* Ground shadow */}
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.3} 
          scale={4} 
          blur={2} 
        />
        
        {/* Controls */}
        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={1}
            minDistance={3}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI - Math.PI / 6}
          />
        )}
      </Canvas>
      
      {/* Controls overlay */}
      {showControls && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
          Click and drag to rotate • Scroll to zoom
        </div>
      )}
    </div>
  )
}