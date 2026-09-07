import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Procedurally paints a photoreal-ish lunar albedo + height map. */
function makeMoonMaps(size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // base regolith
  ctx.fillStyle = "#ece7dc";
  ctx.fillRect(0, 0, size, size);

  // maria (dark basaltic seas)
  const maria = [
    [0.34, 0.32, 0.15],
    [0.52, 0.26, 0.1],
    [0.6, 0.44, 0.12],
    [0.3, 0.55, 0.13],
    [0.72, 0.62, 0.08],
    [0.46, 0.7, 0.09],
  ];
  for (const [mx, my, mr] of maria) {
    const x = mx * size;
    const y = my * size;
    const r = mr * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(132,130,126,0.8)");
    g.addColorStop(0.65, "rgba(168,164,158,0.5)");
    g.addColorStop(1, "rgba(180,176,168,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // craters with sunlit rim + shadowed floor
  const craters = 260;
  for (let i = 0; i < craters; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.pow(Math.random(), 2.4) * size * 0.05 + 2;

    const floor = ctx.createRadialGradient(x, y, 0, x, y, r);
    floor.addColorStop(0, "rgba(118,115,111,0.55)");
    floor.addColorStop(1, "rgba(150,147,142,0)");
    ctx.fillStyle = floor;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,253,244,0.5)";
    ctx.lineWidth = Math.max(0.6, r * 0.12);
    ctx.beginPath();
    ctx.arc(x - r * 0.06, y - r * 0.06, r * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    // bright ejecta for the big ones
    if (r > size * 0.03) {
      const ray = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6);
      ray.addColorStop(0, "rgba(255,253,245,0.22)");
      ray.addColorStop(1, "rgba(255,253,245,0)");
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // fine grain
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 4;

  const bump = new THREE.CanvasTexture(canvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;

  return { map, bump };
}

function makeHaloTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,248,214,0.42)");
  g.addColorStop(0.3, "rgba(226,232,255,0.12)");
  g.addColorStop(0.62, "rgba(190,205,255,0.035)");
  g.addColorStop(1, "rgba(190,205,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A soft shadow disc that gives the moon depth (light falls from upper-right). */
function makeLimbTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size / 2;
  const g = ctx.createRadialGradient(r * 1.25, r * 0.72, r * 0.1, r * 1.0, r * 1.0, r * 1.35);
  g.addColorStop(0, "rgba(8,10,26,0)");
  g.addColorStop(0.5, "rgba(8,10,26,0.05)");
  g.addColorStop(0.78, "rgba(7,9,24,0.2)");
  g.addColorStop(1, "rgba(6,8,22,0.42)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r * 0.99, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Moon({ position = [9, 11, -34] as [number, number, number] }) {
  const sphere = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const { map, bump } = useMemo(() => makeMoonMaps(), []);
  const halomap = useMemo(() => makeHaloTexture(), []);
  const limb = useMemo(() => makeLimbTexture(), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sphere.current) sphere.current.rotation.y = 0.4 + t * 0.006;
    if (halo.current) {
      const s = 1 + Math.sin(t * 0.5) * 0.02;
      halo.current.scale.setScalar(s);
    }
  });

  return (
    <group position={position}>
      {/* soft atmospheric bloom around the disc */}
      <mesh ref={halo} renderOrder={-1}>
        <planeGeometry args={[13, 13]} />
        <meshBasicMaterial
          map={halomap}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>

      {/* the moon itself — lit from the upper right for a real terminator */}
      <mesh ref={sphere}>
        <sphereGeometry args={[2.4, 96, 96]} />
        <meshBasicMaterial map={map} color="#fffdf4" toneMapped={false} fog={false} />
      </mesh>

      {/* limb darkening: a soft shadow that hugs the lower-left edge */}
      <mesh position={[0, 0, 2.42]} renderOrder={1}>
        <planeGeometry args={[4.84, 4.84]} />
        <meshBasicMaterial map={limb} transparent depthWrite={false} fog={false} />
      </mesh>

      {/* rim light so the dark limb still reads against the sky */}
      <pointLight position={[6, 4, 6]} intensity={180} distance={40} color="#fff6dc" />
      <pointLight position={[-7, -3, -4]} intensity={16} distance={28} color="#7d8cff" />
    </group>
  );
}