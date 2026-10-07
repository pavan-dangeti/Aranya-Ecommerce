import { useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { FloatingParticles } from './FloatingParticles'
import { getLeafGeometry } from './assets'

interface BotanicalDriftProps {
  active: boolean
  reducedMotion: boolean
  isMobile: boolean
}

/** Ambient leaf-drift used behind the origin section. Deliberately faint. */
export function BotanicalDrift({ active, reducedMotion, isMobile }: BotanicalDriftProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 6], fov: 45 }}
    >
      <ambientLight intensity={0.9} color="#a8bcab" />
      <directionalLight position={[2, 4, 3]} intensity={0.8} color="#ffe9c4" />
      {!reducedMotion && (
        <>
          <DriftingLeaves count={isMobile ? 5 : 10} />
          <FloatingParticles
            count={isMobile ? 24 : 55}
            area={[11, 7, 3]}
            color="#a8bcab"
            opacity={0.28}
            size={0.035}
            speed={0.09}
          />
        </>
      )}
    </Canvas>
  )
}

function DriftingLeaves({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null)
  const geometry = getLeafGeometry()

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const t = state.clock.elapsedTime
    for (const child of g.children) {
      const mesh = child as THREE.Mesh
      const seed = Number(mesh.userData.seed ?? 0)
      mesh.position.y = -4 + ((t * (0.25 + seed * 0.12) + seed * 3) % 8)
      mesh.position.x = Math.sin(t * 0.4 + seed * 5) * 3.4
      mesh.rotation.z = Math.sin(t * 0.6 + seed) * 0.7
      mesh.rotation.x = t * 0.15 + seed
    }
  })

  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[0, -4, 0]}
          scale={0.42 + (i % 3) * 0.12}
          userData={{ seed: i }}
          geometry={geometry}
        >
          <meshStandardMaterial
            color={['#5d8266', '#8aa48c', '#a9824e'][i % 3]}
            side={THREE.DoubleSide}
            transparent
            opacity={0.32}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}
