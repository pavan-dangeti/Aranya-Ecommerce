import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { FloatingParticles } from './FloatingParticles'
import { LeavesRing } from './LeavesRing'

interface HeroSceneProps {
  active: boolean
  reducedMotion: boolean
  isMobile: boolean
}

export function HeroScene({ active, reducedMotion, isMobile }: HeroSceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, isMobile ? 1.25 : 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.35, 6], fov: 42 }}
      style={{ background: '#07100b' }}
    >
      <color attach="background" args={['#07100b']} />
      <fog attach="fog" args={['#07100b', 8, 17]} />

      <ambientLight intensity={0.4} color="#a8bcab" />
      <directionalLight position={[4, 5, 3]} intensity={1.25} color="#ffe9c4" />
      <pointLight position={[-5, -1.5, -4]} intensity={38} distance={22} color="#7fa0ff" />
      <pointLight position={[2.5, 2, -3.5]} intensity={16} distance={16} color="#c29a64" />

      <BotanicalOrb reducedMotion={reducedMotion} />
      {!reducedMotion && (
        <>
          <LeavesRing
            count={isMobile ? 9 : 14}
            radius={2.05}
            tilt={0.45}
            speed={0.12}
            scale={0.5}
            colors={['#8aa48c', '#a9824e', '#5d8266']}
          />
          <LeavesRing
            count={isMobile ? 7 : 10}
            radius={2.6}
            tilt={-0.55}
            speed={-0.08}
            scale={0.62}
            colors={['#c6d4c7', '#dcc091', '#44684c']}
          />
          <FloatingParticles count={isMobile ? 45 : 130} area={[10, 6, 4]} speed={0.13} />
        </>
      )}
      <CameraDrift reducedMotion={reducedMotion} />
    </Canvas>
  )
}

function BotanicalOrb({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null)
  const wire = useRef<THREE.Mesh>(null)
  const seed = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g || reducedMotion) return
    const t = state.clock.elapsedTime
    g.position.y = Math.sin(t * 0.55) * 0.12
    g.rotation.y += delta * 0.05
    if (wire.current) wire.current.rotation.y -= delta * 0.09
    if (wire.current) wire.current.rotation.x = Math.sin(t * 0.3) * 0.15
    if (seed.current) {
      seed.current.rotation.y += delta * 0.7
      seed.current.position.y = 1.75 + Math.sin(t * 0.9) * 0.1
    }
  })

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.05, 2]} />
        <meshStandardMaterial
          color="#14291e"
          roughness={0.5}
          metalness={0.15}
          emissive="#1b3527"
          emissiveIntensity={0.35}
          flatShading
        />
      </mesh>

      <mesh ref={wire}>
        <icosahedronGeometry args={[1.42, 1]} />
        <meshBasicMaterial color="#c29a64" wireframe transparent opacity={0.16} />
      </mesh>

      <mesh ref={seed} position={[0, 1.75, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#c29a64" metalness={0.85} roughness={0.28} />
      </mesh>

      <mesh position={[0.85, -0.75, 0.6]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color="#dcc091" />
      </mesh>
      <mesh position={[-0.95, 0.35, -0.4]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color="#8aa48c" />
      </mesh>
      <mesh position={[0.3, 1.1, -0.9]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial color="#dcc091" opacity={0.7} transparent />
      </mesh>
    </group>
  )
}

function CameraDrift({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame((state) => {
    if (reducedMotion) return
    const targetX = state.pointer.x * 0.35
    const targetY = 0.35 + state.pointer.y * 0.22
    state.camera.position.x += (targetX - state.camera.position.x) * 0.04
    state.camera.position.y += (targetY - state.camera.position.y) * 0.04
    state.camera.lookAt(0, 0.1, 0)
  })
  return null
}
