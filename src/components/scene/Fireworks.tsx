import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const MAX = 4000;
const PALETTE = [
  new THREE.Color("#ffd28a"),
  new THREE.Color("#ff7ab8"),
  new THREE.Color("#8ad8ff"),
  new THREE.Color("#c9a7ff"),
  new THREE.Color("#fff3c4"),
];

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
  rocket: boolean;
  targetY: number;
  drag?: number;
  glitter?: boolean;
  gravity?: number;
};

export function Fireworks({ active, onBoom }: { active: boolean; onBoom?: () => void }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particles = useRef<Particle[]>([]);
  const next = useRef(0);

  const { positions, colors, sizes, geometry } = useMemo(() => {
    const positions = new Float32Array(MAX * 3);
    const colors = new Float32Array(MAX * 3);
    const sizes = new Float32Array(MAX);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return { positions, colors, sizes, geometry };
  }, []);

  const material = useMemo(() => {
    const sprite = makeSprite();
    return new THREE.PointsMaterial({
      size: 0.42,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    });
  }, []);

  const launch = () => {
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    particles.current.push({
      pos: new THREE.Vector3((Math.random() - 0.5) * 26, -4, -3 - Math.random() * 14),
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.6, 12 + Math.random() * 4, 0),
      life: 0,
      maxLife: 3.2,
      color,
      size: 1,
      rocket: true,
      targetY: 5 + Math.random() * 7,
    });
  };

  /** Sparks that fall behind a climbing rocket. */
  const trail = (p: Particle) => {
    particles.current.push({
      pos: p.pos.clone(),
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, -0.4 - Math.random(), (Math.random() - 0.5) * 0.5),
      life: 0,
      maxLife: 0.5 + Math.random() * 0.4,
      color: p.color.clone().lerp(new THREE.Color("#fff0c0"), 0.6),
      size: 0.35,
      rocket: false,
      targetY: 0,
      drag: 1.6,
      gravity: 1.2,
    });
  };

  const explode = (p: Particle) => {
    const kind = Math.random();
    const shell: "peony" | "ring" | "willow" | "chrysanth" =
      kind < 0.42 ? "peony" : kind < 0.62 ? "ring" : kind < 0.82 ? "willow" : "chrysanth";

    const count = shell === "willow" ? 150 : 200 + Math.floor(Math.random() * 130);
    const spread = (shell === "willow" ? 2.2 : 3.0) + Math.random() * 1.8;
    const second = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    for (let i = 0; i < count; i++) {
      let dir: THREE.Vector3;
      if (shell === "ring") {
        // a flat expanding annulus, tilted a little so it reads as a disc
        const a = (i / count) * Math.PI * 2;
        dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.32, Math.sin(a)).normalize();
      } else {
        // even sphere distribution
        const u = Math.random() * 2 - 1;
        const th = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        dir = new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th));
      }
      const jitter = shell === "ring" ? 0.9 + Math.random() * 0.16 : 0.35 + Math.random() * 0.65;
      const speed = spread * jitter;
      particles.current.push({
        pos: p.pos.clone(),
        vel: dir.multiplyScalar(speed),
        life: 0,
        maxLife: (shell === "willow" ? 2.6 : 1.7) + Math.random() * 1.3,
        color: p.color.clone().lerp(second, Math.random() * (shell === "chrysanth" ? 0.8 : 0.3)),
        size: 0.55 + Math.random() * 0.7,
        rocket: false,
        targetY: 0,
        drag: shell === "willow" ? 1.5 : 0.9,
        gravity: shell === "willow" ? 3.0 : 2.0,
        glitter: shell === "chrysanth" || Math.random() > 0.75,
      });
    }

    // a bright core flash at the moment of the burst
    for (let i = 0; i < 26; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      particles.current.push({
        pos: p.pos.clone(),
        vel: new THREE.Vector3(s * Math.cos(th), u, s * Math.sin(th)).multiplyScalar(0.9),
        life: 0,
        maxLife: 0.32,
        color: new THREE.Color("#fffaf0"),
        size: 2.4,
        rocket: false,
        targetY: 0,
        drag: 4,
        gravity: 0,
      });
    }
    onBoom?.();
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (active) {
      next.current -= delta;
      if (next.current <= 0) {
        launch();
        if (Math.random() > 0.35) launch();
        if (Math.random() > 0.7) launch();
        next.current = 0.26 + Math.random() * 0.45;
      }
    }

    const list = particles.current;
    let write = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.life += delta;
      p.pos.addScaledVector(p.vel, delta);
      if (p.rocket) {
        p.vel.y -= 6 * delta;
        if (Math.random() < delta * 60) trail(p);
        if (p.pos.y >= p.targetY || p.vel.y <= 0) {
          explode(p);
          p.life = p.maxLife + 1;
        }
      } else {
        p.vel.y -= (p.gravity ?? 2.2) * delta;
        p.vel.multiplyScalar(Math.max(0, 1 - (p.drag ?? 0.9) * delta));
      }
      if (p.life < p.maxLife) list[write++] = p;
    }
    list.length = write;

    let n = 0;
    for (let i = 0; i < list.length && n < MAX; i++) {
      const p = list[i];
      const t = 1 - p.life / p.maxLife;
      const twinkle = p.glitter ? 0.45 + 0.55 * Math.abs(Math.sin(p.life * 34 + i)) : 0.78 + 0.22 * Math.sin(p.life * 22);
      const fade = p.rocket ? 1 : Math.pow(t, 0.62) * twinkle;
      positions[n * 3] = p.pos.x;
      positions[n * 3 + 1] = p.pos.y;
      positions[n * 3 + 2] = p.pos.z;
      colors[n * 3] = p.color.r * fade;
      colors[n * 3 + 1] = p.color.g * fade;
      colors[n * 3 + 2] = p.color.b * fade;
      sizes[n] = p.size;
      n++;
    }
    for (let i = n; i < MAX; i++) {
      positions[i * 3 + 1] = -9999;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, MAX);
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}

function makeSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.75)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}