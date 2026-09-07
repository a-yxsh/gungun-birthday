import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Fireworks } from "./Fireworks";
import { Moon } from "./Moon";
import { Aurora, CliffGrass, CloudSea, Fireflies, MoonPath, Pines } from "./Atmosphere";

/** Occasional shooting stars streaking across the upper sky. */
function ShootingStars() {
  const group = useRef<THREE.Group>(null);
  const state = useRef(
    Array.from({ length: 3 }, (_, i) => ({ t: -i * 4 - Math.random() * 6, x: 0, y: 0, z: -26, dur: 1.5 })),
  );
  useFrame((_, delta) => {
    if (!group.current) return;
    state.current.forEach((s, i) => {
      s.t += delta;
      const child = group.current!.children[i];
      if (s.t < 0) {
        child.visible = false;
        return;
      }
      if (s.t > s.dur) {
        s.t = -(4 + Math.random() * 10);
        s.x = -18 + Math.random() * 16;
        s.y = 8 + Math.random() * 9;
        s.dur = 1.1 + Math.random() * 0.8;
        return;
      }
      const k = s.t / s.dur;
      child.visible = true;
      child.position.set(s.x + k * 22, s.y - k * 7, s.z);
      (child as THREE.Mesh).scale.setScalar(1);
      const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = Math.sin(k * Math.PI) * 0.9;
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, 0, -0.3]} visible={false}>
          <planeGeometry args={[3.2, 0.045]} />
          <meshBasicMaterial color="#eaf2ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
        </mesh>
      ))}
    </group>
  );
}

function Ridge({ z, color, scale, offset }: { z: number; color: string; scale: number; offset: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-40, -14);
    const peaks = 9;
    for (let i = 0; i <= peaks; i++) {
      const x = -40 + (80 / peaks) * i;
      const h = (Math.sin(i * 1.7 + offset) * 0.5 + 0.5) * 7 * scale - 2;
      s.lineTo(x, h);
    }
    s.lineTo(40, -14);
    s.closePath();
    return s;
  }, [scale, offset]);

  return (
    <mesh position={[0, -2, z]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Cliff() {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-34, -20);
    s.lineTo(-34, -0.6);
    s.lineTo(-14, -0.35);
    s.lineTo(-7, 0.05);
    s.lineTo(-2.4, -0.15);
    s.lineTo(0.6, -1.1);
    s.lineTo(2.2, -3.2);
    s.lineTo(3.4, -8);
    s.lineTo(5, -20);
    s.closePath();
    return s;
  }, []);
  return (
    <mesh position={[-1, 0, -2]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#05060f" />
    </mesh>
  );
}

const SILHOUETTE = "#04050f";

/** A girl in a long dress, seen three-quarters from behind, chin lifted to the sky. */
function Girl() {
  const group = useRef<THREE.Group>(null);
  const skirt = useRef<THREE.Mesh>(null);
  const strands = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  // a soft A-line gown profile, revolved
  const gown = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const k = i / steps; // 0 = hem, 1 = waist
      const y = k * 1.35;
      // flared hem, cinched waist, gentle ripple in the fabric
      const r = 0.5 * Math.pow(1 - k, 0.72) + 0.115 + Math.sin(k * 9) * 0.012;
      pts.push(new THREE.Vector2(r, y));
    }
    return pts;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.position.y = -0.45 + Math.sin(t * 0.85) * 0.028;
    if (skirt.current) skirt.current.rotation.z = Math.sin(t * 0.9) * 0.03;
    if (head.current) head.current.rotation.x = -0.16 + Math.sin(t * 0.5) * 0.03;
    strands.current?.children.forEach((c, i) => {
      c.rotation.z = 0.22 + i * 0.13 + Math.sin(t * 1.4 + i * 0.8) * 0.1;
      c.rotation.x = Math.sin(t * 1.1 + i) * 0.05;
    });
  });

  const mat = <meshBasicMaterial color={SILHOUETTE} fog={false} />;

  return (
    <group ref={group} position={[-5.8, -0.45, 1.8]} rotation={[0, 0.55, 0]} scale={2.1}>
      {/* ankles peeking below the hem */}
      <mesh position={[-0.05, 0.11, 0]}>
        <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
        {mat}
      </mesh>
      <mesh position={[0.08, 0.1, -0.04]}>
        <capsuleGeometry args={[0.05, 0.14, 6, 10]} />
        {mat}
      </mesh>

      {/* gown */}
      <mesh ref={skirt} position={[0.02, 0.12, 0]}>
        <latheGeometry args={[gown, 40]} />
        {mat}
      </mesh>

      {/* torso + shoulders */}
      <mesh position={[0.02, 1.72, 0]} rotation={[0.05, 0, -0.02]}>
        <capsuleGeometry args={[0.155, 0.34, 8, 18]} />
        {mat}
      </mesh>
      <mesh position={[0.02, 1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.075, 0.24, 8, 14]} />
        {mat}
      </mesh>

      {/* arms, relaxed at her sides */}
      <mesh position={[-0.16, 1.72, 0.03]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.048, 0.58, 6, 12]} />
        {mat}
      </mesh>
      <mesh position={[0.2, 1.72, -0.03]} rotation={[0, 0, -0.11]}>
        <capsuleGeometry args={[0.048, 0.58, 6, 12]} />
        {mat}
      </mesh>

      {/* neck + head, chin lifted */}
      <group ref={head} position={[0.02, 2.12, -0.01]}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.045, 0.1, 6, 10]} />
          {mat}
        </mesh>
        <mesh position={[0, 0.21, 0.005]} scale={[0.95, 1.06, 1]}>
          <sphereGeometry args={[0.155, 28, 28]} />
          {mat}
        </mesh>
        {/* soft bun / crown of hair */}
        <mesh position={[-0.02, 0.27, -0.07]} scale={[1.05, 0.85, 1]}>
          <sphereGeometry args={[0.15, 22, 22]} />
          {mat}
        </mesh>
      </group>

      {/* long hair falling and lifting in the wind */}
      <group ref={strands} position={[0.0, 2.24, -0.09]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.04 + i * 0.035, -0.28 - i * 0.02, -0.02 - i * 0.012]}>
            <capsuleGeometry args={[0.052 - i * 0.006, 0.5 + i * 0.12, 8, 14]} />
            {mat}
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Lanterns() {
  const ref = useRef<THREE.Group>(null);
  const items = useMemo(
    () =>
      Array.from({ length: 22 }, () => ({
        x: (Math.random() - 0.5) * 34,
        y: -6 + Math.random() * 16,
        z: -6 - Math.random() * 18,
        s: 0.05 + Math.random() * 0.07,
        sp: 0.15 + Math.random() * 0.3,
      })),
    [],
  );
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y += items[i].sp * delta;
      child.position.x += Math.sin(child.position.y * 0.4 + i) * 0.06 * delta;
      if (child.position.y > 12) child.position.y = -6;
    });
  });
  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <mesh key={i} position={[it.x, it.y, it.z]}>
          <sphereGeometry args={[it.s, 10, 10]} />
          <meshBasicMaterial color="#ffb877" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

/** A hand-keyframed shot list — the camera "cuts" are eased dolly moves. */
type Shot = { at: number; pos: [number, number, number]; look: [number, number, number]; fov: number };

const SHOTS: Shot[] = [
  // ——— quiet first act: the valley, the moon, and her, before anything burns
  // wide establishing: the whole valley, she is a tiny figure on the cliff
  { at: 0.0, pos: [5.2, 2.4, 28], look: [-3.0, 2.6, -12], fov: 60 },
  // lateral drift across the ridge line — pure parallax, nothing happens yet
  { at: 0.08, pos: [2.6, 2.6, 24], look: [-2.0, 3.4, -14], fov: 57 },
  // lift the eye to the moon, she stays small in frame
  { at: 0.16, pos: [1.2, 3.2, 21], look: [1.6, 6.4, -20], fov: 55 },
  // settle back down and begin the push toward the cliff edge
  { at: 0.24, pos: [0.4, 2.0, 17.5], look: [-4.4, 2.9, -4], fov: 52 },
  // medium: full figure on the left third, sky opens on the right
  { at: 0.32, pos: [-0.6, 1.7, 13.6], look: [-4.9, 3.0, -0.5], fov: 49 },
  // ——— the sky catches: glam shot, low angle, head to hem
  { at: 0.42, pos: [-1.4, 1.0, 10.6], look: [-5.2, 3.3, 1.0], fov: 46 },
  // profile push, closest she ever gets
  { at: 0.52, pos: [-2.6, 1.4, 9.0], look: [-5.4, 3.6, 1.4], fov: 42 },
  // tilt off her and up into the bursts
  { at: 0.62, pos: [-2.2, 2.4, 10.4], look: [-2.4, 8.2, -8], fov: 54 },
  // craning up above the cliff, fireworks all around
  { at: 0.74, pos: [-0.8, 5.8, 12.8], look: [-0.4, 9.8, -14], fov: 58 },
  // drifting back out, she is small again beneath the lit sky
  { at: 0.86, pos: [2.4, 4.6, 18.8], look: [-2.0, 6.4, -18], fov: 60 },
  // wide, hushed, the last embers falling
  { at: 0.94, pos: [1.8, 4.2, 17.4], look: [-1.8, 6.2, -19], fov: 58 },
  // final resting frame for the title
  { at: 1.0, pos: [1.2, 4.0, 16.5], look: [-1.6, 6.0, -20], fov: 57 },
];

// Catmull-Rom splines give C1-continuous motion — no velocity "kick" at shot
// boundaries, which is what made the old lerp feel like cuts instead of a dolly.
const POS_CURVE = new THREE.CatmullRomCurve3(
  SHOTS.map((s) => new THREE.Vector3(...s.pos)),
  false,
  "catmullrom",
  0.5,
);
const LOOK_CURVE = new THREE.CatmullRomCurve3(
  SHOTS.map((s) => new THREE.Vector3(...s.look)),
  false,
  "catmullrom",
  0.5,
);

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _target = new THREE.Quaternion();
const _m = new THREE.Matrix4();
const _up = new THREE.Vector3(0, 1, 0);

/** Map raw scroll onto the shot timeline so each keyframe still lands on its beat. */
function shotParam(p: number) {
  const n = SHOTS.length - 1;
  let i = 0;
  while (i < n - 1 && p > SHOTS[i + 1].at) i++;
  const a = SHOTS[i];
  const b = SHOTS[i + 1];
  const k = THREE.MathUtils.clamp((p - a.at) / (b.at - a.at), 0, 1);
  return { u: (i + k) / n, fov: THREE.MathUtils.lerp(a.fov, b.fov, k) };
}

/** Frame-rate independent critical damping — the core of the "Apple smooth" feel. */
const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

function ScrollCamera({ progress }: { progress: RefObject<number> }) {
  const { camera } = useThree();
  const cur = useRef(0);
  const vel = useRef(0);
  const px = useRef(0);
  const py = useRef(0);

  useFrame(({ clock, pointer }, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = clock.getElapsedTime();

    // spring-damper scrub: inertial, never jittery, always settles
    const target = progress.current ?? 0;
    const stiffness = 26;
    const damping = 2 * Math.sqrt(stiffness) * 1.05;
    vel.current += ((target - cur.current) * stiffness - vel.current * damping) * dt;
    cur.current += vel.current * dt;
    const p = THREE.MathUtils.clamp(cur.current, 0, 1);

    const { u, fov } = shotParam(p);
    POS_CURVE.getPoint(u, _pos);
    LOOK_CURVE.getPoint(u, _look);

    // eased pointer parallax so mouse moves feel weighted, not twitchy
    px.current = damp(px.current, pointer.x, 2.2, dt);
    py.current = damp(py.current, pointer.y, 2.2, dt);

    // very slow, low-amplitude breathing — a steadicam, not a handheld shake
    const sway = Math.sin(t * 0.13) * 0.11 + Math.sin(t * 0.29) * 0.035;
    const bob = Math.sin(t * 0.17) * 0.07;

    camera.position.set(
      damp(camera.position.x, _pos.x + sway + px.current * 0.45, 6, dt),
      damp(camera.position.y, _pos.y + bob + py.current * 0.22, 6, dt),
      damp(camera.position.z, _pos.z, 6, dt),
    );

    // slerp the orientation so the look-at never snaps between shots
    _m.lookAt(camera.position, _look, _up);
    _target.setFromRotationMatrix(_m);
    camera.quaternion.slerp(_target, 1 - Math.exp(-5 * dt));
    camera.rotateZ(Math.sin(t * 0.11) * 0.004);

    const cam = camera as THREE.PerspectiveCamera;
    const nextFov = damp(cam.fov, fov, 4, dt);
    if (Math.abs(cam.fov - nextFov) > 0.002) {
      cam.fov = nextFov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function ParallaxRidges({ progress }: { progress: RefObject<number> }) {
  const g1 = useRef<THREE.Group>(null);
  const g2 = useRef<THREE.Group>(null);
  const g3 = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = progress.current ?? 0;
    if (g1.current) g1.current.position.y += (-p * 0.5 - g1.current.position.y) * 0.08;
    if (g2.current) g2.current.position.y += (-p * 1.1 - g2.current.position.y) * 0.08;
    if (g3.current) g3.current.position.y += (-p * 1.8 - g3.current.position.y) * 0.08;
  });
  return (
    <>
      <group ref={g1}>
        <Ridge z={-30} color="#111541" scale={1.2} offset={0.4} />
      </group>
      <group ref={g2}>
        <Ridge z={-22} color="#0a0e2b" scale={0.95} offset={2.1} />
      </group>
      <group ref={g3}>
        <Ridge z={-14} color="#050718" scale={0.75} offset={4.3} />
      </group>
    </>
  );
}

export default function BirthdayScene({
  fireworksActive,
  progress,
}: {
  fireworksActive: boolean;
  progress: RefObject<number>;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.2, 22], fov: 55 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor("#05061a");
      }}
    >
      <Suspense fallback={null}>
        <fog attach="fog" args={["#0a0d28", 40, 110]} />
        <ambientLight intensity={0.18} />
        <Stars radius={70} depth={40} count={5000} factor={3.4} saturation={0} fade speed={0.6} />
        <Aurora />
        <Moon />
        <MoonPath />
        <ShootingStars />
        <ParallaxRidges progress={progress} />
        <CloudSea />
        <Lanterns />
        <Fireworks active={fireworksActive} />
        <Cliff />
        <CliffGrass />
        <Girl />
        <Fireflies />
        <Pines />
        <ScrollCamera progress={progress} />
        <EffectComposer>
          <Bloom intensity={1.05} luminanceThreshold={0.22} luminanceSmoothing={0.5} mipmapBlur radius={0.72} />
          <Vignette eskil={false} offset={0.22} darkness={0.85} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}