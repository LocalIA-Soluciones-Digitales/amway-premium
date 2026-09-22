"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Soft, slowly shifting colour glow behind the hero/story content — a code
// equivalent of the "liquid energy" backdrop, tinted per active flavour.
const WaveMaterial = shaderMaterial(
  { uTime: 0, uColor: new THREE.Color("#e8384f") },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    void main() {
      vec2 uv = vUv;
      float wave = sin(uv.x * 3.0 + uTime * 0.3) * 0.15 + sin(uv.y * 4.0 - uTime * 0.22) * 0.15;
      float dist = distance(uv, vec2(0.5, 0.4));
      float glow = smoothstep(0.72, 0.0, dist + wave * 0.35);
      float vignette = smoothstep(1.05, 0.25, distance(uv, vec2(0.5)));
      gl_FragColor = vec4(uColor * glow, glow * 0.55 * vignette);
    }
  `
);

// Rising, glassy bubbles — carbonation, not glitter. A shared burst uniform
// gives every bubble a brief radial kick when a flavour changes, standing in
// for a splash transition without needing a separate particle system.
const BubbleMaterial = shaderMaterial(
  { uTime: 0, uBurstTime: -10, uColor: new THREE.Color("#ffffff"), uPixelRatio: 1 },
  /* vertex */ `
    uniform float uTime;
    uniform float uBurstTime;
    uniform float uPixelRatio;
    attribute float aSeed;
    attribute float aSize;
    varying float vAlpha;
    void main() {
      float speed = 0.05 + aSeed * 0.06;
      float t = fract(uTime * speed + aSeed);
      float y = mix(-1.05, 1.05, t);
      float x = position.x + sin(uTime * 0.35 + aSeed * 24.0) * 0.12;

      float dt = uTime - uBurstTime;
      float burst = exp(-max(dt, 0.0) * 2.2) * step(0.0, dt) * 0.55;
      vec2 dir = normalize(vec2(position.x, y - 0.4) + 0.0001);
      x += dir.x * burst;
      y += dir.y * burst;

      vAlpha = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.82, t);

      vec4 mv = modelViewMatrix * vec4(x, y, position.z, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uPixelRatio * (260.0 / -mv.z);
    }
  `,
  /* fragment */ `
    uniform vec3 uColor;
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      if (d > 0.5) discard;
      float rim = smoothstep(0.5, 0.36, d);
      float core = smoothstep(0.3, 0.0, d) * 0.5;
      vec3 color = mix(vec3(1.0), uColor, 0.3);
      gl_FragColor = vec4(color, (rim * 0.5 + core) * vAlpha);
    }
  `
);

extend({ WaveMaterial, BubbleMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    waveMaterial: ThreeElement<typeof WaveMaterial>;
    bubbleMaterial: ThreeElement<typeof BubbleMaterial>;
  }
}

function Wave({ colorRef }: { colorRef: React.RefObject<THREE.Color> }) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
    (ref.current.uniforms.uColor.value as THREE.Color).lerp(colorRef.current!, 0.04);
  });
  return (
    <mesh position={[0, 0, -3]}>
      <planeGeometry args={[14, 14]} />
      <waveMaterial ref={ref} transparent depthWrite={false} />
    </mesh>
  );
}

function Bubbles({
  count,
  colorRef,
  burstKey,
}: {
  count: number;
  colorRef: React.RefObject<THREE.Color>;
  burstKey: number;
}) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const [positions, seeds, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.9;
      positions[i * 3 + 1] = Math.random() * 2 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      seeds[i] = Math.random();
      sizes[i] = 6 + Math.random() * 16;
    }
    return [positions, seeds, sizes];
  }, [count]);

  const prevBurst = useRef(burstKey);
  useEffect(() => {
    if (!ref.current) return;
    if (burstKey !== prevBurst.current) {
      prevBurst.current = burstKey;
      ref.current.uniforms.uBurstTime.value = ref.current.uniforms.uTime.value;
    }
  }, [burstKey]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
    ref.current.uniforms.uPixelRatio.value = state.viewport.dpr;
    (ref.current.uniforms.uColor.value as THREE.Color).lerp(colorRef.current!, 0.04);
  });

  return (
    <points scale={[viewport.width / 2, viewport.height / 2, 1]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <bubbleMaterial
        ref={ref}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function EnergyAtmosphere({
  accent,
  burstKey = 0,
  bubbleCount = 90,
  className,
}: {
  accent: string;
  burstKey?: number;
  bubbleCount?: number;
  className?: string;
}) {
  const colorRef = useRef(new THREE.Color(accent));
  useEffect(() => {
    colorRef.current = new THREE.Color(accent);
  }, [accent]);

  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false }}
      >
        <Wave colorRef={colorRef} />
        <Bubbles count={bubbleCount} colorRef={colorRef} burstKey={burstKey} />
      </Canvas>
    </div>
  );
}
