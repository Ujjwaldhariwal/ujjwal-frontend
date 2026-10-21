import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loopWhileVisible, prefersReducedMotion, rng } from '../lib/motion'

type Tip = { x: number; y: number; title: string; body: string } | null

/** A live, orbitable field of smart meters. Heights breathe like real load; hover any meter for its cluster. */
export default function MeterMap() {
  const host = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = host.current!
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      return
    }
    const reduced = prefersReducedMotion()
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b1030, 18, 42)
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.set(14, 15, 17)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enableZoom = false
    controls.enablePan = false
    controls.autoRotate = !reduced
    controls.autoRotateSpeed = 0.55
    controls.minPolarAngle = 0.5
    controls.maxPolarAngle = 1.2

    // Meter positions: a lumpy "state" silhouette made from noise, not any real map
    const r = rng(42)
    const pos: { x: number; z: number; off: boolean; cluster: number; base: number; ph: number }[] = []
    const S = 0.62
    for (let i = -18; i <= 18; i++) {
      for (let j = -12; j <= 12; j++) {
        const x = i * S, z = j * S
        const ang = Math.atan2(z, x)
        const edge = 9.2 + 1.6 * Math.sin(ang * 3 + 0.6) + 0.9 * Math.sin(ang * 7)
        const d = Math.hypot(x, z * 1.45)
        if (d > edge || r() < 0.18) continue
        pos.push({
          x: x + (r() - 0.5) * 0.2,
          z: z + (r() - 0.5) * 0.2,
          off: r() < 0.035,
          cluster: (Math.floor((i + 18) / 6) * 5 + Math.floor((j + 12) / 6)) + 1,
          base: 0.2 + Math.pow(r(), 2.4) * 3.2 * (1 - d / 13),
          ph: r() * Math.PI * 2,
        })
      }
    }
    const n = pos.length

    const barGeo = new THREE.BoxGeometry(0.07, 1, 0.07)
    barGeo.translate(0, 0.5, 0)
    const bars = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55 }), n)
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.11, 10, 8), new THREE.MeshBasicMaterial(), n)
    const pads = new THREE.InstancedMesh(new THREE.CircleGeometry(0.16, 12), new THREE.MeshBasicMaterial({ color: 0x3b4580, transparent: true, opacity: 0.6 }), n)
    const amber = new THREE.Color('#FFB547'), hot = new THREE.Color('#FFF1D0'), red = new THREE.Color('#FF5A5A')
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), flat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    pos.forEach((p, i) => {
      m.compose(new THREE.Vector3(p.x, 0.01, p.z), flat, new THREE.Vector3(1, 1, 1))
      pads.setMatrixAt(i, m)
      const c = p.off ? red : p.base > 2 ? hot : amber
      bars.setColorAt(i, c)
      bulbs.setColorAt(i, c)
    })
    scene.add(pads, bars, bulbs)

    const grid = new THREE.GridHelper(30, 30, 0x26306a, 0x1a2250)
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.5
    scene.add(grid)

    const heights = new Float32Array(n)
    const update = (t: number) => {
      const s = t * 0.001
      pos.forEach((p, i) => {
        const wave = reduced ? 0 : 0.35 * Math.sin(s * 1.3 + p.x * 0.5 + p.ph) + 0.2 * Math.sin(s * 0.7 + p.z)
        const h = p.off ? 0.05 : Math.max(0.08, p.base + wave * p.base * 0.5)
        heights[i] = h
        m.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(1, h, 1))
        bars.setMatrixAt(i, m)
        m.compose(new THREE.Vector3(p.x, h + 0.05, p.z), q, new THREE.Vector3(1, 1, 1))
        bulbs.setMatrixAt(i, m)
      })
      bars.instanceMatrix.needsUpdate = true
      bulbs.instanceMatrix.needsUpdate = true
    }

    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(el)

    // Hover: which meter is under the pointer?
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let hoverIdx = -1
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect()
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObject(bulbs)[0]
      if (hit && hit.instanceId != null) {
        const p = pos[hit.instanceId]
        hoverIdx = hit.instanceId
        const inCluster = pos.filter((o) => o.cluster === p.cluster)
        const peak = Math.max(...inCluster.map((o) => o.base)) * 2.1
        const off = inCluster.filter((o) => o.off).length
        setTip({
          x: e.clientX - b.left,
          y: e.clientY - b.top,
          title: `Cluster C-${String(p.cluster).padStart(2, '0')} · ${inCluster.length} meters`,
          body: `${p.off ? 'this meter offline' : `this meter ${(heights[hit.instanceId] * 2.1).toFixed(1)} kW`} · peak ${peak.toFixed(1)} kW · ${off} offline`,
        })
        el.style.cursor = 'pointer'
      } else if (hoverIdx !== -1) {
        hoverIdx = -1
        setTip(null)
        el.style.cursor = 'grab'
      }
    }
    const onLeave = () => { hoverIdx = -1; setTip(null) }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    const stop = loopWhileVisible(el, (t) => {
      update(t)
      controls.update()
      renderer.render(scene, camera)
    })

    return () => {
      stop()
      ro.disconnect()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      controls.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return (
    <div className="meter-map" ref={host} aria-label="Interactive 3D map of smart meters. Drag to orbit.">
      <div className="hud">
        <b>Smart-meter analytics, v2</b>
        <span>live 3D meter field · drag to orbit</span>
      </div>
      {failed && <p className="map-fallback">3D needs WebGL. The dashboard renders 5,000+ meters as charts and a spatial map.</p>}
      {tip && (
        <div className="map-tip" style={{ transform: `translate(${tip.x + 16}px, ${tip.y - 70}px)` }}>
          <b>{tip.title}</b>
          <span>{tip.body}</span>
        </div>
      )}
    </div>
  )
}
