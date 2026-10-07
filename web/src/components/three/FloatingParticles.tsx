import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getDotTexture } from './assets'

interface FloatingParticlesProps {
  count?: number
  color?: string
  area?: [number, number, number]
  speed?: number
  size?: number
  opacity?: number
}

const nav = navigator as Navigator & { deviceMemory?: number }
// Point sprites are the costliest per-frame work in these scenes; weak devices skip them.
const LOW_END = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4

export function FloatingParticles(props: FloatingParticlesProps) {
  return LOW_END ? null : <Particles {...props} />
}

function Particles({
  count = 120,
  color = '#dcc091',
  area = [9, 5.5, 4],
  speed = 0.14,
  size = 0.05,
  opacity = 0.55,
}: FloatingParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const texture = useMemo(() => getDotTexture(), [])

  const { positions, drifts, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const drifts = new Float32Array(count)
    const phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area[0]
      positions[i * 3 + 1] = (Math.random() - 0.5) * area[1]
      positions[i * 3 + 2] = (Math.random() - 0.5) * area[2]
      drifts[i] = 0.35 + Math.random() * 0.65
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, drifts, phases }
  }, [count, area])

  useFrame((state, delta) => {
    const points = pointsRef.current
    if (!points) return
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + delta * speed * drifts[i]!
      if (y > area[1] / 2) y = -area[1] / 2
      attr.setY(i, y)
      attr.setX(i, attr.getX(i) + Math.sin(t * 0.5 + phases[i]!) * delta * 0.05)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
