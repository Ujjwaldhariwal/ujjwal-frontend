import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** An Indian 3-pin plug on an orange cable, dropping into a flat extension board as you scroll. */
export type PlugScene = {
  setProgress: (p: number) => void
  setPointer: (x: number, y: number) => void
  /** where the middle socket is on screen, as 0..1 of the canvas */
  socketScreen: () => { x: number; y: number }
  render: (t: number) => void
  resize: () => void
  dispose: () => void
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function createPlugScene(host: HTMLElement, opts: { onSpark: () => void; reduced: boolean }): PlugScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.innerWidth < 760 ? 1.5 : 2, window.devicePixelRatio))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 6, 5)
  scene.add(key, new THREE.AmbientLight(0x9aa0ff, 0.35))
  const sparkLight = new THREE.PointLight(0xffd36b, 0, 6, 2)
  scene.add(sparkLight)

  // ---------- materials ----------
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0xf4efe3, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 })
  const brass = new THREE.MeshStandardMaterial({ color: 0xd8b25a, metalness: 1, roughness: 0.28 })
  const cableMat = new THREE.MeshStandardMaterial({ color: 0xff5a1f, roughness: 0.55 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b1464, roughness: 0.7 })
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x0c0a24, roughness: 1 })
  const switchMat = new THREE.MeshPhysicalMaterial({ color: 0xff5a1f, roughness: 0.35, clearcoat: 0.5, emissive: 0xff5a1f, emissiveIntensity: 0.05 })
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x3a1a10, emissive: 0xff3b1f, emissiveIntensity: 0.4 })

  // ---------- plug ----------
  const pivot = new THREE.Group() // swings like a pendulum from the cable
  const plug = new THREE.Group()
  pivot.add(plug)
  scene.add(pivot)

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.25, 1.5, 0.85, 6, 0.22), plastic)
  plug.add(body)
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.42, 0.5, 32), plastic)
  neck.position.y = 0.95
  plug.add(neck)
  for (let i = 0; i < 5; i++) {
    // grip ridges
    for (const side of [-1, 1]) {
      const r = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.08, 0.6, 2, 0.02), plastic)
      r.position.set(side * 0.635, 0.35 - i * 0.16, 0)
      plug.add(r)
    }
  }
  // embossed label on the front
  const lc = document.createElement('canvas')
  lc.width = 256; lc.height = 256
  const lx = lc.getContext('2d')!
  lx.fillStyle = '#f4efe3'; lx.fillRect(0, 0, 256, 256)
  lx.fillStyle = '#1b1464'
  lx.beginPath(); lx.moveTo(140, 40); lx.lineTo(92, 132); lx.lineTo(124, 132); lx.lineTo(112, 210); lx.lineTo(168, 110); lx.lineTo(136, 110); lx.closePath(); lx.fill()
  lx.font = '700 30px system-ui, sans-serif'; lx.textAlign = 'center'
  lx.fillStyle = 'rgba(27,20,100,.55)'; lx.fillText('UD · 5A 250V', 128, 246)
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(lc), roughness: 0.5, transparent: true }))
  ;(label.material as THREE.MeshStandardMaterial).map!.colorSpace = THREE.SRGBColorSpace
  label.position.set(0, 0.02, 0.427)
  plug.add(label)

  const PIN_LEN = 0.62
  const pins: [number, number, number][] = [[0, -0.2, 0.095], [-0.3, 0.17, 0.072], [0.3, 0.17, 0.072]]
  for (const [x, z, r] of pins) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(r, r, PIN_LEN, 24), brass)
    pin.position.set(x, -0.75 - PIN_LEN / 2, z)
    const tip = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), brass)
    tip.position.y = -PIN_LEN / 2
    pin.add(tip)
    plug.add(pin)
  }
  const PIN_BOTTOM = -0.75 - PIN_LEN // relative to plug centre

  // cable rises out of frame with a lazy S-curve
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.15, 0),
    new THREE.Vector3(0.05, 1.7, 0.05),
    new THREE.Vector3(0.5, 2.6, 0.3),
    new THREE.Vector3(-0.35, 3.7, -0.2),
    new THREE.Vector3(0.25, 5.2, 0),
    new THREE.Vector3(0, 7.5, 0),
  ])
  plug.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.11, 16, false), cableMat))

  // ---------- extension board ----------
  const board = new THREE.Group()
  scene.add(board)
  board.add(new THREE.Mesh(new RoundedBoxGeometry(4.6, 0.5, 1.5, 6, 0.2), plastic))
  const BOARD_TOP = 0.25
  const holesAt = (cx: number) => {
    const plate = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.06, 1.05, 4, 0.03), new THREE.MeshPhysicalMaterial({ color: 0xebe4d3, roughness: 0.5 }))
    plate.position.set(cx, BOARD_TOP + 0.01, 0)
    board.add(plate)
    for (const [x, z, r] of pins) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.25, 0.08, 20), holeMat)
      h.position.set(cx + x, BOARD_TOP + 0.02, z)
      board.add(h)
    }
  }
  ;[-1.3, 0, 1.3].forEach(holesAt)
  const sw = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.16, 0.5, 3, 0.05), switchMat)
  sw.position.set(1.95, BOARD_TOP + 0.08, 0)
  board.add(sw)
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), ledMat)
  led.position.set(1.95, BOARD_TOP + 0.04, 0.48)
  board.add(led)
  // the board's own cable trailing off to the right
  const bc = new THREE.CatmullRomCurve3([new THREE.Vector3(2.3, 0, 0), new THREE.Vector3(3.2, -0.05, 0.4), new THREE.Vector3(4.6, -0.1, -0.2), new THREE.Vector3(8, -0.2, 0.2)])
  board.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 60, 0.09, 12, false), dark))

  // ---------- sparks ----------
  const N = 70
  const sparkGeo = new THREE.BufferGeometry()
  const pos = new Float32Array(N * 3)
  const vel = new Float32Array(N * 3)
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const dot = document.createElement('canvas')
  dot.width = dot.height = 64
  const dx = dot.getContext('2d')!
  const gr = dx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,240,1)'); gr.addColorStop(0.3, 'rgba(255,214,90,.9)'); gr.addColorStop(1, 'rgba(255,90,31,0)')
  dx.fillStyle = gr; dx.fillRect(0, 0, 64, 64)
  const sparkMat = new THREE.PointsMaterial({ size: 0.22, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
  const sparks = new THREE.Points(sparkGeo, sparkMat)
  scene.add(sparks)
  let sparkT = -1

  // ---------- state ----------
  let progress = 0
  let plugged = false
  const pointer = { x: 0, y: 0, sx: 0 }
  const BOARD_TO = -1.75
  let BOARD_FROM = -4.2
  const PLUG_FROM = 0.95
  const plugTo = () => BOARD_TO + BOARD_TOP - 0.42 - PIN_BOTTOM // pins sink 0.42 into the board

  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight
    renderer.setSize(w, h, false)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    camera.aspect = w / h
    // keep the whole board in frame on narrow screens
    camera.position.set(0, 1.5, w / h < 0.8 ? 15 : 10.5)
    BOARD_FROM = w / h < 0.8 ? -8 : -4.2 // fully hidden below the fold until it slides in
    camera.lookAt(0, -0.55, 0)
    camera.updateProjectionMatrix()
  }
  resize()

  const fire = () => {
    sparkT = 0
    for (let i = 0; i < N; i++) {
      const [x, z] = pins[i % 3]
      pos[i * 3] = x; pos[i * 3 + 1] = BOARD_TO + BOARD_TOP + 0.05; pos[i * 3 + 2] = z
      const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3.5
      vel[i * 3] = Math.cos(a) * s; vel[i * 3 + 1] = 2 + Math.random() * 4; vel[i * 3 + 2] = Math.sin(a) * s * 0.6
    }
    sparkGeo.attributes.position.needsUpdate = true
    opts.onSpark()
  }

  let last = 0
  const render = (t: number) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
    last = t
    const p = progress
    board.position.y = lerp(BOARD_FROM, BOARD_TO, smooth(0.1, 0.32, p))
    const drop = smooth(0.08, 0.42, p)
    plug.position.y = lerp(PLUG_FROM, plugTo(), drop)

    // pendulum sway that settles as the plug lines up with the socket
    const free = 1 - smooth(0.2, 0.4, p)
    pointer.sx += (pointer.x - pointer.sx) * 0.05
    const idle = opts.reduced ? 0 : Math.sin(t * 0.0011) * 0.05 + Math.sin(t * 0.0023) * 0.02
    pivot.rotation.z = (idle - pointer.sx * 0.18) * free
    pivot.rotation.x = (pointer.y * 0.08) * free
    plug.rotation.y = (opts.reduced ? 0 : Math.sin(t * 0.0007) * 0.35 + pointer.sx * 0.4) * free + 0.0

    const now = p > 0.415
    if (now && !plugged) fire()
    plugged = now
    switchMat.emissiveIntensity = plugged ? 0.35 : 0.05
    ledMat.emissive.set(plugged ? 0x49e38a : 0xff3b1f)
    ledMat.emissiveIntensity = plugged ? 2.2 : 0.4
    sw.rotation.x = plugged ? -0.22 : 0.22

    if (sparkT >= 0) {
      sparkT += dt
      for (let i = 0; i < N; i++) {
        vel[i * 3 + 1] -= 9 * dt
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt
      }
      sparkGeo.attributes.position.needsUpdate = true
      sparkMat.opacity = Math.max(0, 1 - sparkT / 0.9)
      sparkLight.position.set(0, BOARD_TO + 0.6, 0.4)
      sparkLight.intensity = Math.max(0, 6 * (1 - sparkT / 0.5))
      if (sparkT > 1) { sparkT = -1; sparkMat.opacity = 0 }
    }
    renderer.render(scene, camera)
  }

  return {
    setProgress: (p) => { progress = p },
    setPointer: (x, y) => { pointer.x = x; pointer.y = y },
    socketScreen: () => {
      const v = new THREE.Vector3(0, BOARD_TO + BOARD_TOP, 0).project(camera)
      return { x: (v.x + 1) / 2, y: (1 - v.y) / 2 }
    },
    render,
    resize,
    dispose: () => {
      renderer.dispose()
      pmrem.dispose()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose?.()
      })
      renderer.domElement.remove()
    },
  }
}
