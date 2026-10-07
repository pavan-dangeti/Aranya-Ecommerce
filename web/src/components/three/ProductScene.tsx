import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float, Lightformer, Environment, OrbitControls } from '@react-three/drei'

interface ProductSceneProps {
  active: boolean
  reducedMotion: boolean
  palette: { glass: string; liquid?: string; accent: string }
  interactive?: boolean
}

export function ProductScene({
  active,
  reducedMotion,
  palette,
  interactive = true,
}: ProductSceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0.4, 0.8, 5.3], fov: 36 }}
    >
      <ambientLight intensity={0.5} color="#c6d4c7" />
      <directionalLight position={[3, 4, 2]} intensity={1.35} color="#ffedd0" />
      <pointLight position={[-4, 1.5, -3]} intensity={26} distance={18} color="#bcd4ff" />

      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2} position={[0, 3, 2]} scale={[6, 1, 1]} color="#fff3dd" />
        <Lightformer intensity={1.2} position={[-3, 0.5, -2]} scale={[1, 3, 1]} color="#bcd4ff" />
        <Lightformer intensity={1} position={[3, -0.5, 1]} scale={[1, 2, 1]} color="#dcc091" />
      </Environment>

      <Float
        speed={reducedMotion ? 0 : 1.3}
        rotationIntensity={reducedMotion ? 0 : 0.12}
        floatIntensity={reducedMotion ? 0 : 0.4}
      >
        <HerbalBottle glass={palette.glass} accent={palette.accent} />
      </Float>

      <ContactShadows
        position={[0, -0.52, 0]}
        opacity={0.42}
        scale={7}
        blur={2.6}
        far={2}
        color="#04120a"
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={interactive}
        enableRotate={interactive}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.85}
        enableDamping
        dampingFactor={0.08}
        minDistance={3.6}
        maxDistance={7.2}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.62}
        target={[0, 0.32, 0]}
      />
    </Canvas>
  )
}

function HerbalBottle({ glass, accent }: { glass: string; accent: string }) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!group.current) return
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.02 - 0.15
  })

  const body = useMemo(() => {
    const points = [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.55, 0.05),
      new THREE.Vector2(0.57, 0.3),
      new THREE.Vector2(0.53, 0.66),
      new THREE.Vector2(0.41, 0.9),
      new THREE.Vector2(0.235, 1.06),
      new THREE.Vector2(0.225, 1.12),
      new THREE.Vector2(0.225, 1.42),
      new THREE.Vector2(0.24, 1.44),
      new THREE.Vector2(0.24, 1.47),
    ]
    return new THREE.LatheGeometry(points, 64)
  }, [])

  const parts = useMemo(() => {
    const bandPoints = [
      new THREE.Vector2(0.575, 0.14),
      new THREE.Vector2(0.587, 0.17),
      new THREE.Vector2(0.587, 0.69),
      new THREE.Vector2(0.575, 0.72),
    ]
    const ring = new THREE.TorusGeometry(0.587, 0.009, 8, 64)
    ring.rotateX(Math.PI / 2)
    return {
      band: new THREE.LatheGeometry(bandPoints, 64),
      ringTop: ring.clone(),
    }
  }, [])

  return (
    <group ref={group} rotation={[0, 0.5, 0]} scale={[0.92, 1.04, 0.92]}>
      <mesh geometry={body}>
        <meshPhysicalMaterial
          color={glass}
          roughness={0.22}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.18}
          envMapIntensity={1.1}
        />
      </mesh>

      <mesh geometry={parts.band}>
        <meshStandardMaterial
          color="#f4efe3"
          roughness={0.85}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={parts.ringTop} position={[0, 0.155, 0]}>
        <meshStandardMaterial color={accent} roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh geometry={parts.ringTop} position={[0, 0.705, 0]}>
        <meshStandardMaterial color={accent} roughness={0.45} metalness={0.4} />
      </mesh>

      <mesh position={[0, 1.53, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.17, 48]} />
        <meshStandardMaterial
          color="#a9824e"
          metalness={0.85}
          roughness={0.32}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh position={[0, 1.635, 0]}>
        <cylinderGeometry args={[0.282, 0.282, 0.05, 48]} />
        <meshStandardMaterial color="#c29a64" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  )
}
