'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Box, Plane } from '@react-three/drei'
import * as THREE from 'three'

interface SimpleTShirtProps {
  designImageUrl?: string
  color?: string
  autoRotate?: boolean
}

function TShirtShape({ color = '#FFFFFF', designImageUrl }: { color: string; designImageUrl?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Animate rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main body */}
      <Box args={[2, 2.5, 0.3]} position={[0, 0, 0]}>
        <meshStandardMaterial color={color} />
      </Box>
      
      {/* Left sleeve */}
      <Box args={[0.8, 1.2, 0.3]} position={[-1.2, 0.3, 0]} rotation={[0, 0, -0.3]}>
        <meshStandardMaterial color={color} />
      </Box>
      
      {/* Right sleeve */}
      <Box args={[0.8, 1.2, 0.3]} position={[1.2, 0.3, 0]} rotation={[0, 0, 0.3]}>
        <meshStandardMaterial color={color} />
      </Box>
      
      {/* Collar area */}
      <Box args={[0.8, 0.3, 0.35]} position={[0, 1.3, 0]}>
        <meshStandardMaterial color={color} />
      </Box>
      
      {/* Design on front if provided */}
      {designImageUrl && (
        <Plane args={[1.4, 1.4]} position={[0, 0, 0.16]}>
          <meshBasicMaterial transparent opacity={0.9}>
            <primitive attach="map" object={new THREE.TextureLoader().load(designImageUrl)} />
          </meshBasicMaterial>
        </Plane>
      )}
    </group>
  )
}

export default function SimpleTShirt({ designImageUrl, color = '#FFFFFF', autoRotate = true }: SimpleTShirtProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Environment for realistic reflections */}
        <Environment preset="studio" />
        
        {/* T-shirt Model */}
        <TShirtShape color={color} designImageUrl={designImageUrl} />
        
        {/* Ground shadow */}
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.3} 
          scale={5} 
          blur={2} 
        />
        
        {/* Controls */}
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
      </Canvas>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
        Click and drag to rotate • Scroll to zoom
      </div>
    </div>
  )
}