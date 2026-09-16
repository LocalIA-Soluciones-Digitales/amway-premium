"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, Float, useTexture } from "@react-three/drei";
import * as THREE from "three";

function Can({ hovered, image }: { hovered: boolean; image: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useTexture(`/images/catalog/${image}`);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    const target = hovered ? 2.4 : 0.18;
    mesh.current.rotation.y += delta * target;
  });

  return (
    <Float speed={hovered ? 3 : 1.2} rotationIntensity={0.1} floatIntensity={hovered ? 0.5 : 0.2}>
      <mesh ref={mesh}>
        <planeGeometry args={[1.85, 2.5]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}

export function XSEnergyScene({ image }: { image: string }) {
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
          background:
            "radial-gradient(circle, rgba(77,142,255,0.35), rgba(212,175,106,0.15) 45%, transparent 70%)",
          opacity: hovered ? 1 : 0.35,
        }}
      />
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
        <ambientLight intensity={0.9} />
        <Suspense fallback={null}>
          <Can hovered={hovered} image={image} />
        </Suspense>
        <Sparkles
          count={hovered ? 90 : 25}
          scale={[4, 4, 4]}
          size={hovered ? 3.5 : 1.5}
          speed={hovered ? 1.2 : 0.3}
          color="#4d8eff"
          opacity={0.8}
        />
      </Canvas>
    </div>
  );
}
