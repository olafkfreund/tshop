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

interface RealisticToteProps {
  designImageUrl?: string
  color?: string
  autoRotate?: boolean
}

function ToteModel({ color = '#F5F5DC', designImageUrl }: { color: string; designImageUrl?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const [designTexture] = designImageUrl ? useTexture([designImageUrl], (textures) => {
    console.log('Tote texture loaded successfully:', designImageUrl)
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
  
  // Create tote bag body geometry
  const bagGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const width = 2
    const height = 2.4
    const gussetDepth = 0.3
    
    // Create bag outline (front view)
    shape.moveTo(-width/2, -height/2)
    shape.lineTo(-width/2, height/2)
    shape.lineTo(width/2, height/2)
    shape.lineTo(width/2, -height/2)
    shape.closePath()
    
    // Extrude to create 3D shape with gusset
    const extrudeSettings = {
      steps: 2,
      depth: gussetDepth,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 3
    }
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [])
  
  // Create handle geometry
  const handleGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.5, 0, 0),
      new THREE.Vector3(-0.5, 0.8, 0),
      new THREE.Vector3(-0.4, 1.2, 0),
      new THREE.Vector3(0, 1.3, 0),
      new THREE.Vector3(0.4, 1.2, 0),
      new THREE.Vector3(0.5, 0.8, 0),
      new THREE.Vector3(0.5, 0, 0)
    ])
    
    return new THREE.TubeGeometry(curve, 20, 0.06, 8, false)
  }, [])
  
  // Animate gentle rotation and swing
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Bag body */}
      <mesh geometry={bagGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.05}
        />
        
        {/* Design decal on front */}
        {designImageUrl && designTexture && (
          <Decal
            position={[0, 0, 0.16]}
            rotation={[0, 0, 0]}
            scale={[1.4, 1.4, 1]}
            map={designTexture}
            transparent
            alphaTest={0.1}
          />
        )}
      </mesh>
      
      {/* Canvas texture overlay for fabric look */}
      <mesh geometry={bagGeometry}>
        <meshStandardMaterial
          color={color}
          roughness={0.95}
          metalness={0.02}
          transparent
          opacity={0.2}
          normalScale={new THREE.Vector2(1, 1)}
        />
      </mesh>
      
      {/* Left handle */}
      <mesh 
        geometry={handleGeometry} 
        position={[-0.3, 1.2, 0.15]}
        castShadow
      >
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      
      {/* Right handle */}
      <mesh 
        geometry={handleGeometry} 
        position={[0.3, 1.2, 0.15]}
        castShadow
      >
        <meshStandardMaterial 
          color={color}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      
      {/* Bottom gusset detail */}
      <mesh position={[0, -1.2, 0.15]} castShadow>
        <boxGeometry args={[2, 0.02, 0.3]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      
      {/* Side gusset details */}
      <mesh position={[-1, 0, 0.15]} castShadow>
        <boxGeometry args={[0.02, 2.4, 0.3]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
      
      <mesh position={[1, 0, 0.15]} castShadow>
        <boxGeometry args={[0.02, 2.4, 0.3]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>
    </group>
  )
}

export default function RealisticTote({ 
  designImageUrl, 
  color = '#F5F5DC', 
  autoRotate = true 
}: RealisticToteProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      <Canvas 
        shadows
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        
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
        <Environment preset="apartment" />
        
        {/* Tote Bag Model */}
        <ToteModel color={color} designImageUrl={designImageUrl} />
        
        {/* Realistic ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <MeshReflectorMaterial
            blur={[0, 0]}
            resolution={2048}
            mixBlur={1}
            mixStrength={15}
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
          position={[0, -2.5, 0]} 
          opacity={0.4} 
          scale={5} 
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
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 4}
        />
      </Canvas>
      
      {/* Controls overlay */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-600 bg-white bg-opacity-90 px-3 py-2 rounded-md shadow-sm">
        <div className="font-medium">3D Tote Bag Preview</div>
        <div className="mt-1 opacity-80">Drag to rotate • Scroll to zoom</div>
      </div>
    </div>
  )
}