import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** A soft horizontal band of luminous fog — used for the cloud sea in the valley. */
function makeBandTexture(inner: string, outer: string, size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Slow drifting sea of cloud sitting between the ridges. */
export function CloudSea() {
  const tex = useMemo(() => makeBandTexture("rgba(150,168,255,0.30)", "rgba(96,116,210,0.10)"), []);
  const items = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: -26 + Math.random() * 52,
        y: -5.4 + Math.random() * 2.4,
        z: -26 + i * 2.1,
        w: 24 + Math.random() * 22,
        h: 6 + Math.random() * 5,
        sp: 0.12 + Math.random() * 0.28,
      })),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((c, i) => {
      c.position.x += items[i].sp * delta;
      if (c.position.x > 34) c.position.x = -34;
    });
  });
  return (
    <group ref={group}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]}>
          <planeGeometry args={[it.w, it.h]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0.75}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function makeAuroraTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, size, 0, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.22, "rgba(88,255,208,0.34)");
  g.addColorStop(0.55, "rgba(120,180,255,0.22)");
  g.addColorStop(0.82, "rgba(196,140,255,0.10)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // vertical curtain striations
  ctx.globalCompositeOperation = "destination-in";
  for (let x = 0; x < size; x += 2) {
    const a = 0.35 + 0.65 * Math.abs(Math.sin(x * 0.017) * Math.sin(x * 0.0041 + 1.3));
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, 0, 2, size);
  }
  // fade the horizontal edges
  ctx.globalCompositeOperation = "destination-in";
  const edge = ctx.createLinearGradient(0, 0, size, 0);
  edge.addColorStop(0, "rgba(255,255,255,0)");
  edge.addColorStop(0.5, "rgba(255,255,255,1)");
  edge.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Northern-lights curtains breathing behind the ridges. */
export function Aurora() {
  const tex = useMemo(() => makeAuroraTexture(), []);
  const group = useRef<THREE.Group>(null);
  const bands = useMemo(
    () => [
      { x: -12, y: 9, z: -40, w: 34, h: 18, rot: 0.16, sp: 0.21, o: 0.5 },
      { x: 6, y: 12, z: -46, w: 42, h: 22, rot: -0.1, sp: 0.14, o: 0.38 },
      { x: 18, y: 8, z: -38, w: 26, h: 15, rot: 0.24, sp: 0.3, o: 0.3 },
    ],
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    group.current?.children.forEach((c, i) => {
      const b = bands[i];
      c.position.x = b.x + Math.sin(t * b.sp) * 3.2;
      c.scale.y = 1 + Math.sin(t * b.sp * 1.7 + i) * 0.12;
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = b.o * (0.7 + 0.3 * Math.sin(t * 0.4 + i * 2));
    });
  });
  return (
    <group ref={group}>
      {bands.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, 0, b.rot]}>
          <planeGeometry args={[b.w, b.h]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={b.o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Warm fireflies hovering around the cliff edge, close to camera. */
export function Fireflies({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -12 + Math.random() * 16;
      positions[i * 3 + 1] = -1 + Math.random() * 5;
      positions[i * 3 + 2] = 1 + Math.random() * 9;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.3 + Math.random() * 0.7;
      seeds[i * 3 + 2] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,236,180,1)");
    g.addColorStop(0.3, "rgba(255,190,110,0.5)");
    g.addColorStop(1, "rgba(255,170,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(c);

    const material = new THREE.PointsMaterial({
      size: 0.16,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    return { geometry, material, seeds };
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const base = seeds[i * 3];
      const sp = seeds[i * 3 + 1];
      pos.array[i * 3] = (pos.array[i * 3] as number) + Math.sin(t * sp + base) * 0.004;
      pos.array[i * 3 + 1] = (pos.array[i * 3 + 1] as number) + Math.cos(t * sp * 0.8 + base) * 0.005;
    }
    pos.needsUpdate = true;
    material.opacity = 0.55 + 0.45 * Math.sin(t * 1.2);
  });

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />;
}

/** Pine silhouettes standing on the cliff, framing the shot. */
export function Pines() {
  const trees = useMemo(
    () => [
      { x: -16.5, y: -0.5, z: 1.2, s: 2.6 },
      { x: -13.2, y: -0.6, z: 3.4, s: 1.9 },
      { x: -19.5, y: -0.7, z: 4.6, s: 3.2 },
      { x: -10.4, y: -0.9, z: 6.2, s: 1.5 },
      { x: -23.0, y: -0.8, z: 2.0, s: 2.3 },
    ],
    [],
  );
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, t.y, t.z]} scale={t.s}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.8, 6]} />
            <meshBasicMaterial color="#02030a" fog={false} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0, 0.9 + k * 0.55, 0]}>
              <coneGeometry args={[0.62 - k * 0.15, 0.95, 8]} />
              <meshBasicMaterial color="#02030a" fog={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Wind-blown grass along the cliff edge, right under the camera. */
export function CliffGrass() {
  const group = useRef<THREE.Group>(null);
  const blades = useMemo(
    () =>
      Array.from({ length: 90 }, () => ({
        x: -14 + Math.random() * 16,
        y: -0.55 + Math.random() * 0.1,
        z: 1.5 + Math.random() * 6.5,
        h: 0.35 + Math.random() * 0.65,
        tilt: (Math.random() - 0.5) * 0.5,
        ph: Math.random() * Math.PI * 2,
      })),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    group.current?.children.forEach((c, i) => {
      c.rotation.z = blades[i].tilt + Math.sin(t * 1.3 + blades[i].ph) * 0.16;
    });
  });
  return (
    <group ref={group}>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.x, b.y + b.h / 2, b.z]} rotation={[0, 0, b.tilt]}>
          <coneGeometry args={[0.028, b.h, 4]} />
          <meshBasicMaterial color="#02030a" fog={false} />
        </mesh>
      ))}
    </group>
  );
}

/** A distant lake catching the moonlight, far below the cliff. */
export function MoonPath() {
  const tex = useMemo(() => makeBandTexture("rgba(255,246,214,0.30)", "rgba(180,196,255,0.07)"), []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.scale.x = 1 + Math.sin(t * 0.35) * 0.05;
      ref.current.scale.y = 1 + Math.cos(t * 0.28) * 0.07;
    }
  });
  return (
    <mesh ref={ref} position={[9, -7.5, -30]} rotation={[0, 0, 0]}>
      <planeGeometry args={[10, 14]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </mesh>
  );
}