import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getLeafGeometry } from './assets'

interface LeavesRingProps {
  count?: number
  radius?: number
  tilt?: number
  speed?: number
  scale?: number
  colors?: string[]
  yOffset?: number
}

const dummy = new THREE.Object3D()
const tmpColor = new THREE.Color()

export function LeavesRing({
  count = 12,
  radius = 2.1,
  tilt = 0.4,
  speed = 0.12,
  scale = 0.55,
  colors = ['#8aa48c', '#a9824e', '#5d8266'],
  yOffset = 0,
}: LeavesRingProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => getLeafGeometry(), [])

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        roughness: 0.65,
        metalness: 0.05,
      }),
    [],
  )

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        phase: (i / count) * Math.PI * 2 + Math.random() * 0.5,
        flutterPhase: Math.random() * Math.PI * 2,
        scaleJitter: 0.75 + Math.random() * 0.5,
      })),
    [count],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      tmpColor.set(colors[i % colors.length]!)
      mesh.setColorAt(i, tmpColor)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, colors])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const seed = seeds[i]!
      const angle = seed.phase + speed * t
      const bob = Math.sin(t * 1.1 + seed.flutterPhase) * 0.08
      dummy.position.set(Math.cos(angle) * radius, yOffset + bob, Math.sin(angle) * radius)
      dummy.rotation.set(
        tilt + Math.sin(t * 0.9 + seed.flutterPhase) * 0.25,
        -angle,
        Math.PI / 2 + Math.cos(t * 1.3 + seed.flutterPhase) * 0.3,
      )
      dummy.scale.setScalar(scale * seed.scaleJitter)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false} />
}
