"use client"

import { useEffect, useRef } from "react"
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  ClampToEdgeWrapping,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  LinearSRGBColorSpace,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from "three"

export default function MoonScene() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    // Scene
    const scene = new Scene()

    // Camera
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, 2.8)

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    // Output color space and tone mapping
    // Using newer API names (Three r150+)
    // @ts-ignore
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.setClearColor(0x000000, 0) // transparent background
    container.appendChild(renderer.domElement)

    // Resize handling (works whether component fills viewport or a smaller parent)
    const resize = () => {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      const maxDpr = window.innerWidth < 900 ? 1.1 : 1.35
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    // Lights
    // Main directional (sun) light — slightly increased for clarity
    const dir = new DirectionalLight(0xffffff, 1.2)
    dir.position.set(5, 3, 2)
    scene.add(dir)

    // Ambient fill to lift deep shadows slightly
    const ambient = new AmbientLight(0xffffff, 0.22)
    scene.add(ambient)

    // Subtle hemisphere to give a cold-space fill (sky) and warm ground tint
    const hemi = new HemisphereLight(0x8899ff, 0x080820, 0.16)
    scene.add(hemi)

    // Stronger soft fill light from the left to reduce deep shadows on the dark limb
    const leftFill = new DirectionalLight(0xfff6e0, 1.0)
    // move it slightly more frontal and a bit closer to soften the shadow
    leftFill.position.set(-1.5, 0.6, 1.5)
    scene.add(leftFill)

    // Rim/back light to give separation on the dark side
    const rim = new DirectionalLight(0xffffff, 0.45)
    rim.position.set(-3, 1, -2)
    scene.add(rim)

    // Material + geometry
    const geometry = new SphereGeometry(0.2, 96, 96)

    // Texture paths (must be placed in public/textures/moon/)
    const colorPath = "/textures/moon/%D0%9B%D0%A3%D0%9D%D0%90%20%D0%9C%D0%90%D0%97%D0%90%D0%A4%D0%90%D0%9A%D0%90.jpeg"
    const normalPath = "/textures/moon/moon-2k-normal.jpg"
    const heightPath = "/textures/moon/moon-2k-height.jpg"
    const isCustomMoonTexture = colorPath.includes("%D0%9B%D0%A3%D0%9D%D0%90")

    const loader = new TextureLoader()
    const textures: Texture[] = []

    const buildSeamBlendedMoonTexture = (image: CanvasImageSource) => {
      const targetWidth = 3072
      const targetHeight = 1536
      const canvas = document.createElement("canvas")
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      const src = image as HTMLImageElement
      const srcW = src.naturalWidth || src.width
      const srcH = src.naturalHeight || src.height
      if (!srcW || !srcH) return null

      const scale = Math.max(targetWidth / srcW, targetHeight / srcH)
      const drawW = srcW * scale
      const drawH = srcH * scale
      const dx = (targetWidth - drawW) / 2
      const dy = (targetHeight - drawH) / 2
      ctx.drawImage(src, dx, dy, drawW, drawH)

      const seamWidth = Math.max(10, Math.floor(targetWidth * 0.028))
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const data = imgData.data

      for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < seamWidth; x++) {
          const leftIndex = (y * targetWidth + x) * 4
          const rightX = targetWidth - 1 - x
          const rightIndex = (y * targetWidth + rightX) * 4
          const edgeBlend = 1 - x / Math.max(1, seamWidth - 1)

          for (let channel = 0; channel < 4; channel++) {
            const left = data[leftIndex + channel]
            const right = data[rightIndex + channel]
            const avg = (left + right) * 0.5

            data[leftIndex + channel] = left * (1 - edgeBlend) + avg * edgeBlend
            data[rightIndex + channel] = right * (1 - edgeBlend) + avg * edgeBlend
          }
        }
      }

      ctx.putImageData(imgData, 0, 0)
      const seamlessTex = new CanvasTexture(canvas)
      seamlessTex.wrapS = RepeatWrapping
      seamlessTex.wrapT = ClampToEdgeWrapping
      seamlessTex.repeat.set(1, 1)
      seamlessTex.offset.set(0.5, 0)
      seamlessTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      // @ts-ignore
      seamlessTex.colorSpace = SRGBColorSpace
      return seamlessTex
    }

    // Load color (sRGB), normal (Linear), displacement (Linear)
    let material: MeshStandardMaterial

    const colorTex = loader.load(colorPath, (loadedTex) => {
      if (isCustomMoonTexture && loadedTex.image && material) {
        const seamlessTexture = buildSeamBlendedMoonTexture(loadedTex.image)
        if (seamlessTexture) {
          material.map = seamlessTexture
          material.needsUpdate = true
          textures.push(seamlessTexture)
          loadedTex.dispose()
        }
      }
      renderer.render(scene, camera)
    })
    // @ts-ignore
    colorTex.colorSpace = SRGBColorSpace
    colorTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    textures.push(colorTex)

    const normalTex = isCustomMoonTexture
      ? null
      : loader.load(normalPath, () => renderer.render(scene, camera))
    if (normalTex) {
      // normal maps use linear space
      // @ts-ignore
      normalTex.colorSpace = LinearSRGBColorSpace
      textures.push(normalTex)
    }

    const heightTex = isCustomMoonTexture
      ? null
      : loader.load(heightPath, () => renderer.render(scene, camera))
    if (heightTex) {
      // @ts-ignore
      heightTex.colorSpace = LinearSRGBColorSpace
      textures.push(heightTex)
    }

    material = new MeshStandardMaterial({
      map: colorTex,
      normalMap: normalTex,
      displacementMap: heightTex,
      // small displacement to keep subtle surface relief without deep occlusion
      displacementScale: isCustomMoonTexture ? 0 : 0.01,
      roughness: 0.85,
      metalness: 0,
    })

    const moon = new Mesh(geometry, material)
    // ensure the main lit mesh renders first
    moon.renderOrder = 0
    scene.add(moon)

    const moonGroup = new Group()
    moonGroup.add(moon)
    if (isCustomMoonTexture) {
      moonGroup.rotation.y = Math.PI
    }
    scene.add(moonGroup)

    // Headlight subtle exposure (optional subtle gamma handled by renderer settings)

    let rafId: number
    let lastFrameTime = 0
    const targetFrameMs = 1000 / 45

    const clock = new Clock()

    const animate = (time: number) => {
      if (time - lastFrameTime < targetFrameMs) {
        rafId = requestAnimationFrame(animate)
        return
      }
      lastFrameTime = time

      const delta = clock.getDelta()
      // slow rotation
      moonGroup.rotation.y += delta * 0.04 // radians/sec ~ slow
      // slight axial tilt for realism
      moonGroup.rotation.x = MathUtils.lerp(moonGroup.rotation.x, 0.02, 0.02)

      if (!document.hidden) {
        renderer.render(scene, camera)
      }
      rafId = requestAnimationFrame(animate)
    }

    // Use ResizeObserver if available for parent-sized containers
    let ro: ResizeObserver | null = null
    let resizeRaf = 0
    const scheduleResize = () => {
      if (resizeRaf) return
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0
        resize()
      })
    }
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(scheduleResize)
      ro.observe(container)
    } else {
      window.addEventListener("resize", scheduleResize)
    }

    // Initial size and start
    resize()
    rafId = requestAnimationFrame(animate)

    // Cleanup on unmount
    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener("resize", scheduleResize)
      cancelAnimationFrame(rafId)
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      // dispose geometry, material, textures, renderer
      geometry.dispose()
      material.dispose()
      textures.forEach((t) => t.dispose())
      // remove canvas
      if (renderer.domElement && renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    />
  )
}
