"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 260;

function AirParticles({ hovered }: { hovered: boolean }) {
  const points = useRef<THREE.Points>(null);
  const seeds = useMemo(() => {
    return new Array(COUNT).fill(0).map(() => ({
      radius: 0.4 + Math.random() * 2.2,
      angle: Math.random() * Math.PI * 2,
      height: (Math.random() - 0.5) * 3,
      speed: 0.2 + Math.random() * 0.6,
      wobble: Math.random() * Math.PI * 2,
    }));
  }, []);

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const t = state.clock.elapsedTime;
    const arr = points.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      s.angle += delta * s.speed * (hovered ? 0.4 : 1.6);
      const wob = Math.sin(t * s.speed + s.wobble) * (hovered ? 0.05 : 0.35);
      const radius = hovered ? s.radius * 0.55 : s.radius;

      const x = Math.cos(s.angle) * (radius + wob);
      const z = Math.sin(s.angle) * (radius + wob);
      const y = hovered
        ? ((s.height + t * 0.4) % 3) - 1.5
        : s.height + Math.sin(t * s.speed + s.wobble) * 0.3;

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={hovered ? 0.05 : 0.035}
        color={hovered ? "#bff7e6" : "#8b8fa3"}
        transparent
        opacity={hovered ? 0.95 : 0.5}
        sizeAttenuation
      />
    </points>
  );
}

export function AtmosphereScene() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="relative aspect-square w-full"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, rgba(53,208,161,0.3), transparent 70%)",
          opacity: hovered ? 1 : 0.25,
        }}
      />
      <Canvas camera={{ position: [0, 0, 5.5], fov: 42 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <AirParticles hovered={hovered} />
      </Canvas>
    </div>
  );
}
