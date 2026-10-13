/**
 * Ambiente de estúdio de oficina para os reflexos da pintura:
 * teto com luminárias hexagonais (o visual clássico de box de estética e
 * auto elétrica) e duas softboxes laterais. Vira um mapa de ambiente via PMREM.
 */
import * as THREE from 'three'

export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const scene = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(30, 12, 30),
    new THREE.MeshBasicMaterial({ color: '#1e1f23', side: THREE.BackSide }),
  )
  room.position.y = 4
  scene.add(room)

  const light = (v: number, tint = '#ffffff') => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(v) })
    m.toneMapped = false
    return m
  }

  // Grade de hexágonos no teto
  const tubeMat = light(5)
  const r = 1.1
  const h = Math.sqrt(3) * r
  const tube = new THREE.BoxGeometry(r, 0.06, 0.08)
  for (let row = -3; row <= 3; row++) {
    for (let col = -3; col <= 3; col++) {
      const cx = col * r * 3 + (Math.abs(row) % 2 ? r * 1.5 : 0)
      const cz = row * (h / 2)
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6
        const m = new THREE.Mesh(tube, tubeMat)
        m.position.set(cx + Math.cos(a) * (h / 2), 6.5, cz + Math.sin(a) * (h / 2))
        m.rotation.y = -a + Math.PI / 2
        scene.add(m)
      }
    }
  }

  // Softboxes laterais (uma levemente quente, cor da marca)
  const soft = new THREE.Mesh(new THREE.PlaneGeometry(10, 3), light(2.2))
  soft.position.set(0, 2.5, -9)
  scene.add(soft)
  const warm = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.5), light(1.6, '#f3c77a'))
  warm.position.set(-9, 2, 2)
  warm.rotation.y = Math.PI / 2
  scene.add(warm)
  const cool = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.5), light(1.4, '#dfe7f5'))
  cool.position.set(9, 2, -1)
  cool.rotation.y = -Math.PI / 2
  scene.add(cool)
  // Chão levemente claro para o reflexo de baixo
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: '#2c2d31' }))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.5
  scene.add(floor)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const tex = pmrem.fromScene(scene, 0.02).texture
  pmrem.dispose()
  return tex
}
