'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  useTexture,
  Decal,
  MeshReflectorMaterial
} from '@react-three/drei'
import * as THREE from 'three'

interface RealisticCapProps {
  designImageUrl?: string
  color?: string
  autoRotate?: boolean
}

function CapModel({ color = '#000000', designImageUrl }: { color: string; designImageUrl?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const [designTexture] = designImageUrl ? useTexture([designImageUrl], (textures) => {
    console.log('Cap texture loaded successfully:', designImageUrl)
    if (textures[0]) {
      textures[0].anisotropy = 16
      textures[0].flipY = false
      textures[0].wrapS = THREE.ClampToEdgeWrapping
      textures[0].wrapT = THREE.ClampToEdgeWrapping
    }
  }) : [null]
  
  // Set texture properties if texture exists
  if (designTexture) {
    designTexture.anisotropy = 16
    designTexture.flipY = false
    designTexture.wrapS = THREE.ClampToEdgeWrapping
    designTexture.wrapT = THREE.ClampToEdgeWrapping
  }
  
  // Create cap geometry
  const capGeometry = useMemo(() => {
    // Create a sphere for the crown
    const geometry = new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    return geometry
  }, [])
  
  const billGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const width = 1.2
    const depth = 0.8
    
    // Create bill/visor shape
    shape.moveTo(-width, 0)
    shape.quadraticCurveTo(-width, depth, -width * 0.7, depth * 1.2)
    shape.quadraticCurveTo(0, depth * 1.3, width * 0.7, depth * 1.2)
    shape.quadraticCurveTo(width, depth, width, 0)
    shape.lineTo(width * 0.8, 0)
    shape.quadraticCurveTo(0, depth * 0.3, -width * 0.8, 0)
    shape.closePath()
    
    const extrudeSettings = {
      steps: 2,
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 3
    }
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])
  
  // Animate gentle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Cap crown */}
      <mesh geometry={capGeometry} castShadow receiveShadow position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={color}
          roughness={0.8}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
        
        {/* Design decal on front panel */}
        {designImageUrl && designTexture && (
          <Decal
            position={[0, -0.2, 0.9]}
            rotation={[0, 0, 0]}
            scale={[0.6, 0.4, 0.6]}
            map={designTexture}
            transparent
            alphaTest={0.1}
          />
        )}
      </mesh>
      
      {/* Cap button on top */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Bill/Visor */}
      <mesh 
        geometry={billGeometry} 
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0.9]}
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={color}
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      
      {/* Adjustment strap */}
      <mesh position={[0, -0.3, -0.95]} castShadow>
        <boxGeometry args={[0.4, 0.1, 0.1]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.2}
        />
      </mesh>
      
      {/* Strap buckle */}
      <mesh position={[0, -0.3, -1.05]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.05]} />
        <meshStandardMaterial 
          color="#888888"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
    </group>
  )
}

export default function RealisticCap({ 
  designImageUrl, 
  color = '#000000', 
  autoRotate = true 
}: RealisticCapProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      <Canvas 
        shadows
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.5, 4]} />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.3}
        />
        <pointLight position={[0, 10, 0]} intensity={0.2} />
        
        {/* Environment for realistic reflections */}
        <Environment preset="studio" />
        
        {/* Cap Model */}
        <CapModel color={color} designImageUrl={designImageUrl} />
        
        {/* Realistic ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <MeshReflectorMaterial
            blur={[0, 0]}
            resolution={2048}
            mixBlur={1}
            mixStrength={10}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#d0d0d0"
            metalness={0.5}
          />
        </mesh>
        
        {/* Shadow */}
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.4} 
          scale={4} 
          blur={2.5}
          far={4}
        />
        
        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minDistance={2.5}
          maxDistance={6}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-90 px-3 py-2 rounded-md shadow-sm">
        <div className="font-medium">3D Cap Preview</div>
        <div className="mt-1 opacity-80">Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  )
}