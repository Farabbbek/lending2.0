import { useEffect, useRef } from "react"
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  Box3,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Shape,
  Vector3,
  WebGLRenderer,
  type ExtrudeGeometryOptions,
} from "three"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js"

type Logo3DProps = {
  variant?: string
}

export default function Logo3D({ variant: _variant }: Logo3DProps = {}) {
  const wrapper = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!wrapper.current) return
    const container = wrapper.current

    // --- THREE.js scene setup ---
    const scene = new Scene()
    const camera = new PerspectiveCamera(45, 1, 0.1, 200)
    camera.position.set(0, 0, 30)

    const renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    const resize = () => {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // lighting minimal
    const dir = new DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 10, 7)
    scene.add(dir)
    scene.add(new AmbientLight(0xffffff, 0.12))

    // load svg + sample once
    const loader = new SVGLoader()
    const group = new Group()
    // SVGLoader inverts Y axis — flip 180° on Z to correct orientation
    group.rotation.z = Math.PI
    // scale down the logo so it fits visually in the section
    group.scale.set(-0.39, 0.39, 0.39)
    scene.add(group)

    const extrudeSettings: ExtrudeGeometryOptions = { depth: 0.2, bevelEnabled: false }

    loader.load(
      "/logo.svg",
      (data: { paths: any[] }) => {
        const paths = data.paths as any[]
        const shapes: Shape[] = []
        paths.forEach((p) => {
          p.toShapes(true).forEach((s: Shape) => shapes.push(s))
        })
        if (shapes.length === 0) return
        const geoms = shapes.map((s) => new ExtrudeGeometry(s, extrudeSettings))

        // center
        const bbox = new Box3()
        geoms.forEach((g) => {
          g.computeBoundingBox()
          if (g.boundingBox) {
            bbox.expandByPoint(g.boundingBox.min)
            bbox.expandByPoint(g.boundingBox.max)
          }
        })
        const center = bbox.getCenter(new Vector3())
        geoms.forEach((g) => g.translate(-center.x, -center.y, -center.z))

        // sample
        const merged = BufferGeometryUtils.mergeGeometries(geoms, false)!
        const mesh = new Mesh(merged)
        const sampler = new MeshSurfaceSampler(mesh).build()

        const count = 6000
        const posArr = new Float32Array(count * 3)
        const tmp = new Vector3()
        for (let i = 0; i < count; i++) {
          sampler.sample(tmp)
          posArr[i * 3] = tmp.x
          posArr[i * 3 + 1] = tmp.y
          posArr[i * 3 + 2] = tmp.z
        }
        const ptsGeom = new BufferGeometry()
        ptsGeom.setAttribute("position", new BufferAttribute(posArr, 3))
        const ptsMat = new PointsMaterial({
          color: 0xffffff,
          size: 0.018,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: AdditiveBlending,
        })
        const pts = new Points(ptsGeom, ptsMat)
        group.add(pts)
      },
      undefined,
      (err: unknown) => console.error("SVG load error", err),
    )

    // initial size
    resize()

    let raf: number
    const animate = () => {
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
      container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return <div ref={wrapper} style={{ width: "100%", height: "35vh", position: "relative" }} />
}
