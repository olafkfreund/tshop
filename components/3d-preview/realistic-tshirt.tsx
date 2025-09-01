'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  useTexture,
  Decal,
  RenderTexture,
  Text,
  MeshReflectorMaterial
} from '@react-three/drei'
import * as THREE from 'three'

interface RealisticTShirtProps {
  designImageUrl?: string
  color?: string
  autoRotate?: boolean
}

function TShirtModel({ color = '#FFFFFF', designImageUrl }: { color: string; designImageUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [designTexture] = designImageUrl ? useTexture([designImageUrl], (textures) => {
    // Success callback - texture loaded
    console.log('T-shirt texture loaded successfully:', designImageUrl)
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
  
  // Create a more realistic t-shirt shape using custom geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    
    // Create t-shirt body outline (front view)
    const width = 2
    const height = 2.8
    const sleeveWidth = 0.7
    const sleeveHeight = 0.8
    const neckWidth = 0.6
    const neckDepth = 0.2
    
    // Start from bottom left
    shape.moveTo(-width/2, -height/2)
    // Left side
    shape.lineTo(-width/2, height/2 - sleeveHeight)
    // Left sleeve bottom
    shape.lineTo(-width/2 - sleeveWidth, height/2 - sleeveHeight - 0.2)
    // Left sleeve top
    shape.lineTo(-width/2 - sleeveWidth, height/2 - 0.1)
    // Left sleeve to shoulder
    shape.lineTo(-width/2, height/2 - 0.1)
    // Left shoulder to neck
    shape.quadraticCurveTo(-width/2, height/2, -neckWidth/2, height/2)
    // Neck curve
    shape.quadraticCurveTo(0, height/2 - neckDepth, neckWidth/2, height/2)
    // Right shoulder from neck
    shape.quadraticCurveTo(width/2, height/2, width/2, height/2 - 0.1)
    // Right sleeve from shoulder
    shape.lineTo(width/2 + sleeveWidth, height/2 - 0.1)
    // Right sleeve top
    shape.lineTo(width/2 + sleeveWidth, height/2 - sleeveHeight - 0.2)
    // Right sleeve bottom
    shape.lineTo(width/2, height/2 - sleeveHeight)
    // Right side
    shape.lineTo(width/2, -height/2)
    // Bottom
    shape.closePath()
    
    // Extrude to create 3D shape
    const extrudeSettings = {
      steps: 2,
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 5
    }
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])
  
  // Animate gentle rotation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color}
          roughness={0.8}
          metalness={0.1}
        />
        
        {/* Design decal on front */}
        {designImageUrl && designTexture && (
          <Decal
            position={[0, 0.3, 0.11]}
            rotation={[0, 0, 0]}
            scale={[1.2, 1.2, 1]}
            map={designTexture}
            transparent
            alphaTest={0.1}
          />
        )}
      </mesh>
      
      {/* Add subtle fabric texture */}
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          roughness={0.95}
          metalness={0.05}
          transparent
          opacity={0.1}
          normalScale={new THREE.Vector2(0.5, 0.5)}
        />
      </mesh>
    </group>
  )
}

export default function RealisticTShirt({ 
  designImageUrl, 
  color = '#FFFFFF', 
  autoRotate = true 
}: RealisticTShirtProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      <Canvas 
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
        {/* Lighting setup for realistic look */}
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.4}
        />
        <pointLight position={[0, 10, 0]} intensity={0.2} />
        
        {/* Environment for realistic reflections */}
        <Environment preset="city" />
        
        {/* T-shirt Model */}
        <TShirtModel color={color} designImageUrl={designImageUrl} />
        
        {/* Realistic ground with reflection */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <MeshReflectorMaterial
            blur={[0, 0]}
            resolution={2048}
            mixBlur={1}
            mixStrength={20}
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
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={6} 
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
          minDistance={3}
          maxDistance={7}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-90 px-3 py-2 rounded-md shadow-sm">
        <div className="font-medium">3D Preview Controls</div>
        <div className="mt-1 opacity-80">Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  )
}