"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const WaterMaterial = shaderMaterial(
  { uTime: 0, uIntensity: 0.2, uColorA: new THREE.Color("#0d3b52"), uColorB: new THREE.Color("#7fd8ff") },
  /* vertex */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave = sin(pos.x * 6.0 + uTime * 1.6) * cos(pos.y * 5.0 - uTime * 1.1);
      pos.z += wave * (0.06 + uIntensity * 0.16);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* fragment */ `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    void main() {
      float ripple = sin((vUv.x + vUv.y) * 18.0 - uTime * 2.5) * 0.5 + 0.5;
      float glow = smoothstep(0.2, 1.0, ripple) * (0.4 + uIntensity);
      vec3 color = mix(uColorA, uColorB, glow);
      gl_FragColor = vec4(color, 0.75);
    }
  `
);

extend({ WaterMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    waterMaterial: ThreeElement<typeof WaterMaterial>;
  }
}

function WaterPlane({ hovered }: { hovered: boolean }) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
    ref.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      ref.current.uniforms.uIntensity.value,
      hovered ? 0.9 : 0.15,
      0.06
    );
  });

  return (
    <mesh rotation={[-Math.PI / 2.4, 0, 0]}>
      <planeGeometry args={[6, 6, 64, 64]} />
      <waterMaterial ref={ref} transparent />
    </mesh>
  );
}

export function ESpringScene() {
  const [hovered, setHovered] = useState(false);
  const dropletColor = useMemo(() => "#bfe9ff", []);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative aspect-square w-full"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, rgba(79,216,255,0.35), transparent 70%)",
          opacity: hovered ? 1 : 0.3,
        }}
      />
      <Canvas camera={{ position: [0, 2.4, 3.6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <WaterPlane hovered={hovered} />
        <Sparkles
          count={hovered ? 70 : 20}
          scale={[3.5, 1.5, 3.5]}
          size={hovered ? 2.5 : 1.2}
          speed={hovered ? 0.9 : 0.2}
          color={dropletColor}
          opacity={0.9}
        />
      </Canvas>
    </div>
  );
}
