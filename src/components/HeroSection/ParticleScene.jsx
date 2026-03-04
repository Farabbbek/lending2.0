import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Object3D, PointsMaterial, ShaderMaterial, Vector3 } from 'three'

const LazyHeroSceneControls = lazy(() => import('./HeroSceneControls'))
const LazyHeroPostEffects = lazy(() => import('./HeroPostEffects'))

/* ═══════════════════════════════════════════════════════════════════
   GLSL — Simplex 3-D noise (Ashima / Stefan Gustavson)
   ═══════════════════════════════════════════════════════════════════ */
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
  vec3 i1=min(g,l.zxy);vec3 i2=max(g,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.,i1.z,i2.z,1.))+
    i.y+vec4(0.,i1.y,i2.y,1.))+
    i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}\n`

/* ═══════════════════════════════════════════════════════════════════
   SHADERS — Electron probability cloud
   ═══════════════════════════════════════════════════════════════════ */
const electronVert = NOISE + `
uniform float uTime;
uniform float uPulse;
attribute float aSize;
attribute float aRandom;
attribute float aPhase;
attribute vec3  aVel;
varying float vAlpha;
varying float vDist;

void main(){
  vec3 pos = position;
  float dist = length(pos);

  // organic noise displacement (2 samples for perf)
  float n1 = snoise(pos * 0.4 + uTime * 0.08 + aRandom * 10.0);
  float n2 = snoise(pos * 0.6 - uTime * 0.06 + aRandom * 20.0);
  pos += aVel * n1 * 0.25;
  pos += normalize(pos) * n2 * 0.08;

  // orbital instability wobble
  float w = sin(uTime * 0.3 + aPhase) * 0.05;
  pos.x += w * pos.y * 0.04;
  pos.y += w * pos.z * 0.04;

  // probability density: appear / disappear
  float prob = snoise(pos * 0.45 + uTime * 0.12 + aRandom * 50.0);
  prob = smoothstep(-0.2, 0.7, prob);

  // energy pulse wave from nucleus — slower 10s cycle
  float pw = sin(dist * 2.5 - uPulse * 6.28) * 0.5 + 0.5;
  pw *= exp(-dist * 0.3)
     * smoothstep(0.0, 0.1, uPulse)
     * (1.0 - smoothstep(0.6, 1.0, uPulse));
  pos += normalize(pos) * pw * 0.15;

  // alpha: fade near center to avoid bright blob
  float centerFade = smoothstep(0.3, 1.5, dist);
  vAlpha = prob * (0.3 + pw * 0.4) * centerFade;
  vDist  = dist;

  // size: smaller near center, bigger at edges
  float sizeMul = mix(0.3, 1.0, smoothstep(0.5, 2.5, dist));
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = max(aSize * sizeMul * (120.0 / -mv.z) * (0.8 + pw * 0.2), 0.5);
  gl_Position  = projectionMatrix * mv;
}
`

const electronFrag = `
varying float vAlpha;
varying float vDist;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if(d > 0.5) discard;
  // sharp dot with soft edge — no soapy glow
  float core = smoothstep(0.5, 0.15, d);
  float a = core * core * vAlpha;
  vec3 col = mix(vec3(1.0, 1.0, 1.0), vec3(0.55, 0.55, 0.6), smoothstep(1.0, 5.0, vDist));
  gl_FragColor = vec4(col, a);
}
`

/* ═══════════════════════════════════════════════════════════════════
   SHADERS — Cosmic web connection lines
   ═══════════════════════════════════════════════════════════════════ */
const webVert = NOISE + `
uniform float uTime;
attribute float aOp;
varying float vOp;
void main(){
  vOp = aOp;
  vec3 pos = position;
  pos += normalize(pos) * snoise(pos * 0.3 + uTime * 0.08) * 0.07;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const webFrag = `
uniform float uTime;
varying float vOp;
void main(){
  float flicker = sin(uTime * 1.5 + vOp * 40.0) * 0.25 + 0.75;
  gl_FragColor = vec4(0.75, 0.75, 0.78, vOp * flicker * 0.14);
}
`

/* ═══════════════════════════════════════════════════════════════════
   DATA GENERATORS
   ═══════════════════════════════════════════════════════════════════ */
function generateElectronCloud(count) {
  const pos = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const randoms = new Float32Array(count)
  const phases = new Float32Array(count)
  const vels = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const shell = Math.random()
    let r, sizeBase

    if (shell < 0.25) {
      r = 0.8 + Math.random() * 0.7
      sizeBase = 1.2
    } else if (shell < 0.55) {
      r = 1.5 + Math.random() * 1.0
      sizeBase = 1.1
    } else if (shell < 0.80) {
      r = 2.5 + Math.random() * 1.5
      sizeBase = 1.0
    } else {
      r = 4.0 + Math.random() * 2.5
      sizeBase = 0.8
    }

    if (shell >= 0.25 && shell < 0.55) {
      const axis = Math.floor(Math.random() * 3)
      let x = Math.random() - 0.5
      let y = Math.random() - 0.5
      let z = Math.random() - 0.5
      if (axis === 0) { y *= 0.3; z *= 0.3 }
      else if (axis === 1) { x *= 0.3; z *= 0.3 }
      else { x *= 0.3; y *= 0.3 }
      const len = Math.sqrt(x * x + y * y + z * z) || 1
      pos[i * 3] = (x / len) * r
      pos[i * 3 + 1] = (y / len) * r
      pos[i * 3 + 2] = (z / len) * r
    } else {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }

    sizes[i] = sizeBase * (0.4 + Math.random() * 0.6)
    randoms[i] = Math.random()
    phases[i] = Math.random() * Math.PI * 2
    const t = new Vector3(
      Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5
    ).normalize()
    vels[i * 3] = t.x
    vels[i * 3 + 1] = t.y
    vels[i * 3 + 2] = t.z
  }
  return { pos, sizes, randoms, phases, vels }
}

function generateCosmicWeb(nodeCount, maxDist) {
  const nodes = []
  for (let i = 0; i < nodeCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 2.0 + Math.random() * 4.5
    nodes.push(new Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ))
  }

  const lp = [], lo = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = nodes[i].distanceTo(nodes[j])
      if (d < maxDist) {
        lp.push(
          nodes[i].x, nodes[i].y, nodes[i].z,
          nodes[j].x, nodes[j].y, nodes[j].z
        )
        const op = 1.0 - d / maxDist
        lo.push(op, op)
      }
    }
  }

  return {
    nodePos: new Float32Array(nodes.flatMap(n => [n.x, n.y, n.z])),
    linePos: new Float32Array(lp),
    lineOp: new Float32Array(lo),
  }
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Quantum Nucleus (energy core)
   ═══════════════════════════════════════════════════════════════════ */
function QuantumNucleus() {
  const coreRef = useRef()
  const lightRef = useRef()
  const groupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const phase = (t % 10.0) / 10.0
    const pulse = Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 4)

    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = 1.2 + pulse * 2.0
      const s = 1.0 + pulse * 0.1
      coreRef.current.scale.set(s, s, s)
    }
    if (lightRef.current) lightRef.current.intensity = 2 + pulse * 3
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.08
    }
  })

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={lightRef} color="#ffffff" intensity={2} distance={20} decay={2} />
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Electron Probability Cloud
   ═══════════════════════════════════════════════════════════════════ */
function ElectronCloud({ count = 3500 }) {
  const data = useMemo(() => generateElectronCloud(count), [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: electronVert,
        fragmentShader: electronFrag,
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    material.uniforms.uTime.value = t
    material.uniforms.uPulse.value = (t % 10.0) / 10.0
  })

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={data.pos} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={data.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={data.randoms} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={count} array={data.phases} itemSize={1} />
        <bufferAttribute attach="attributes-aVel" count={count} array={data.vels} itemSize={3} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Cosmic Web (particle interaction network)
   ═══════════════════════════════════════════════════════════════════ */
function CosmicWeb({ qualityTier = 'high' }) {
  const nodeCount = qualityTier === 'low' ? 80 : qualityTier === 'medium' ? 140 : 220
  const maxDist = qualityTier === 'low' ? 1.7 : qualityTier === 'medium' ? 1.9 : 2.0
  const webData = useMemo(() => generateCosmicWeb(nodeCount, maxDist), [nodeCount, maxDist])

  const lineMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: webVert,
        fragmentShader: webFrag,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  )

  const dotMat = useMemo(
    () =>
      new PointsMaterial({
        size: 0.045,
        color: '#cccccc',
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    []
  )

  useFrame(({ clock }) => {
    lineMat.uniforms.uTime.value = clock.elapsedTime
  })

  useEffect(() => {
    return () => {
      lineMat.dispose()
      dotMat.dispose()
    }
  }, [lineMat, dotMat])

  const vtxCount = webData.linePos.length / 3

  return (
    <group>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={webData.nodePos.length / 3}
            array={webData.nodePos}
            itemSize={3}
          />
        </bufferGeometry>
        <primitive object={dotMat} attach="material" />
      </points>

      {vtxCount > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={vtxCount} array={webData.linePos} itemSize={3} />
            <bufferAttribute attach="attributes-aOp" count={vtxCount} array={webData.lineOp} itemSize={1} />
          </bufferGeometry>
          <primitive object={lineMat} attach="material" />
        </lineSegments>
      )}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Energy Pulse Waves (expanding from core)
   ═══════════════════════════════════════════════════════════════════ */
function EnergyPulseWaves() {
  const refs = useRef([])
  const offsets = useMemo(() => [0, 5.0], [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      const phase = ((t + offsets[i]) % 10.0) / 10.0
      const scale = 0.4 + phase * 6.0
      const opacity = Math.max(0, (1.0 - phase * phase) * 0.06)
      mesh.scale.setScalar(scale)
      mesh.material.opacity = opacity
    })
  })

  return (
    <>
      {offsets.map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.06}
            wireframe
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Orbital Rings
   ═══════════════════════════════════════════════════════════════════ */
function OrbitalRings({ qualityTier = 'high' }) {
  const groupRef = useRef()
  const ringsRef = useRef()
  const dummy = useMemo(() => new Object3D(), [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.15) * 0.1
    }
  })

  const rings = useMemo(
    () => [
      { radius: 2.5, rotation: [Math.PI * 0.5, 0, 0] },
      { radius: 3.2, rotation: [Math.PI * 0.35, Math.PI * 0.2, 0] },
      { radius: 4.0, rotation: [Math.PI * 0.7, 0, Math.PI * 0.3] },
      { radius: 5.0, rotation: [Math.PI * 0.15, Math.PI * 0.6, 0] },
    ],
    [qualityTier]
  )

  useEffect(() => {
		if (!ringsRef.current) return
		const baseRadius = 2.5
		rings.forEach((ring, index) => {
			dummy.position.set(0, 0, 0)
			dummy.rotation.set(ring.rotation[0], ring.rotation[1], ring.rotation[2])
			const scale = ring.radius / baseRadius
			dummy.scale.set(scale, scale, scale)
			dummy.updateMatrix()
			ringsRef.current.setMatrixAt(index, dummy.matrix)
		})
		ringsRef.current.instanceMatrix.needsUpdate = true
	}, [dummy, rings])

  return (
    <group ref={groupRef}>
			<instancedMesh ref={ringsRef} args={[undefined, undefined, rings.length]}>
				<torusGeometry args={[2.5, 0.0045, qualityTier === 'low' ? 6 : 8, qualityTier === 'low' ? 36 : 52]} />
				<meshBasicMaterial
					color="#ffffff"
					transparent
					opacity={qualityTier === 'low' ? 0.035 : 0.055}
					blending={AdditiveBlending}
					depthWrite={false}
				/>
			</instancedMesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT — Ambient Cosmic Dust
   ═══════════════════════════════════════════════════════════════════ */
function AmbientDust({ count = 1200 }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 220
      p[i * 3 + 1] = (Math.random() - 0.5) * 220
      p[i * 3 + 2] = (Math.random() - 0.5) * 220
    }
    return p
  }, [count])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.00006
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#cccccc"
        transparent
        opacity={0.2}
        sizeAttenuation
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCENE EXPORT
   ═══════════════════════════════════════════════════════════════════ */
export default function ParticleScene({
  qualityTier = 'high',
  enablePostProcessing = true,
  progressiveLevel = 'full',
  onInteractionStart,
  onInteractionEnd,
}) {
  const sceneGroupRef = useRef()
  const isMinimalBoot = progressiveLevel === 'minimal'

  // Quality tiers reduce draw calls/vertices on weaker devices.
  const electronCount = isMinimalBoot
    ? qualityTier === 'low'
      ? 120
      : qualityTier === 'medium'
        ? 220
        : 320
    : qualityTier === 'low'
      ? 400
      : qualityTier === 'medium'
        ? 800
        : 1200

  const dustCount = isMinimalBoot
    ? qualityTier === 'low'
      ? 70
      : qualityTier === 'medium'
        ? 130
        : 180
    : qualityTier === 'low'
      ? 180
      : qualityTier === 'medium'
        ? 350
        : 700

  const shouldShowWeb = !isMinimalBoot
  const shouldShowPulse = !isMinimalBoot && qualityTier !== 'low'

  useFrame(({ clock }, delta) => {
    if (!sceneGroupRef.current) return
    const speed = isMinimalBoot ? 0.06 : 0.1
    sceneGroupRef.current.rotation.y += delta * speed
    sceneGroupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.15) * 0.05
  })

  return (
    <>
      <ambientLight intensity={qualityTier === 'low' ? 0.06 : 0.08} />

      <group ref={sceneGroupRef} position={[0, 0, 0]}>
        <QuantumNucleus />
        <ElectronCloud count={electronCount} />
        {shouldShowWeb && <CosmicWeb qualityTier={qualityTier} />}
        {shouldShowPulse && <EnergyPulseWaves />}
        <OrbitalRings qualityTier={qualityTier} />
      </group>

      <AmbientDust count={dustCount} />

      <Suspense fallback={null}>
        <LazyHeroSceneControls
          qualityTier={qualityTier}
          onInteractionStart={onInteractionStart}
          onInteractionEnd={onInteractionEnd}
        />
      </Suspense>

      {/* Post FX are disabled on medium/low tiers to reduce GPU cost. */}
      {enablePostProcessing && (
        <Suspense fallback={null}>
          <LazyHeroPostEffects />
        </Suspense>
      )}
    </>
  )
}
