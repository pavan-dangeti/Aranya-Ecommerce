import * as THREE from 'three'

let dotTexture: THREE.CanvasTexture | null = null

export function getDotTexture(): THREE.CanvasTexture {
  if (dotTexture) return dotTexture
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  dotTexture = new THREE.CanvasTexture(canvas)
  return dotTexture
}

let leafGeometry: THREE.ShapeGeometry | null = null

export function getLeafGeometry(): THREE.ShapeGeometry {
  if (leafGeometry) return leafGeometry
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(0.34, 0.3, 0.26, 0.72)
  shape.quadraticCurveTo(0.12, 0.92, 0, 1)
  shape.quadraticCurveTo(-0.12, 0.92, -0.26, 0.72)
  shape.quadraticCurveTo(-0.34, 0.3, 0, 0)
  leafGeometry = new THREE.ShapeGeometry(shape, 6)
  return leafGeometry
}
