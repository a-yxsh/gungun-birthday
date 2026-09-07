import { lazy, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { ClientOnly } from "@/components/ClientOnly";

const BirthdayScene = lazy(() => import("@/components/scene/BirthdayScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Happy Birthday, Gungun — A Scroll-Scrubbed Sky" },
      {
        name: "description",
        content:
          "A one-page scroll film for Gungun: a cliff beneath a photoreal moon, fireworks blooming frame by frame, and a wish written across the sky.",
      },
      { property: "og:title", content: "Happy Birthday, Gungun — A Scroll-Scrubbed Sky" },
      {
        property: "og:description",
        content: "Scroll to play the film: climb the cliff, light the sky, read the wish at the end.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

/** A caption that fades in and out across a slice of the scroll timeline. */
function Cue({
  progress,
  range,
  children,
  kicker,
  className = "",
  drift = 90,
  align = "center",
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: React.ReactNode;
  kicker?: string;
  className?: string;
  drift?: number;
  align?: "center" | "left" | "right";
}) {
  const [a, b] = range;
  const pad = (b - a) * 0.28;
  const opacity = useTransform(progress, [a, a + pad, b - pad, b], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, b], [drift, -drift]);
  const scale = useTransform(progress, [a, a + pad, b - pad, b], [0.965, 1, 1, 0.985]);
  const ruleScale = useTransform(progress, [a, a + pad * 1.6], [0, 1]);
  const origin = align === "right" ? "right" : align === "left" ? "left" : "center";
  return (
    <motion.div
      style={{ opacity, y, scale, willChange: "transform, opacity" }}
      className={`pointer-events-none absolute inset-x-0 px-6 ${className}`}
    >
      {kicker ? (
        <p
          className={`mb-4 text-[0.55rem] uppercase tracking-[0.46em] text-gold/70 ${
            align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center"
          }`}
        >
          {kicker}
        </p>
      ) : null}
      {children}
      <motion.div
        aria-hidden
        style={{ scaleX: ruleScale, transformOrigin: origin }}
        className={`mt-6 h-px w-24 bg-gradient-to-r from-transparent via-gold/60 to-transparent ${
          align === "right" ? "ml-auto" : align === "left" ? "mr-auto" : "mx-auto"
        }`}
      />
    </motion.div>
  );
}

function Film() {
  const wrap = useRef<HTMLDivElement>(null);
  const sceneProgress = useRef(0);
  const [fireworks, setFireworks] = useState(false);

  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  // gentle, slightly over-damped spring: glides to rest with no overshoot
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 26, mass: 0.35, restDelta: 0.0002 });

  useEffect(() => {
    return p.on("change", (v) => {
      sceneProgress.current = v;
      setFireworks((prev) => {
        // the sky stays quiet for the first four beats, then it catches
        const nextVal = v > 0.345 && v < 0.955;
        return prev === nextVal ? prev : nextVal;
      });
    });
  }, [p]);

  const title = useMemo(() => "Happy Birthday, Gungun".split(""), []);

  const vignette = useTransform(p, [0, 0.5, 1], [0.6, 0.2, 0.72]);
  const barH = useTransform(p, [0, 0.04, 0.95, 1], ["0svh", "7svh", "7svh", "0svh"]);
  const finaleOpacity = useTransform(p, [0.9, 0.965], [0, 1]);
  const finaleScale = useTransform(p, [0.9, 1], [0.94, 1]);
  const hintOpacity = useTransform(p, [0, 0.03], [1, 0]);
  const outroOpacity = useTransform(p, [0.97, 1], [0, 1]);
  const leak = useTransform(p, [0.34, 0.5, 0.72, 0.9], [0, 0.4, 0.22, 0]);
  // cool moonlit blue over the quiet act, warm gold once the sky burns
  const coolWash = useTransform(p, [0, 0.16, 0.34], [0.3, 0.42, 0]);

  return (
    <div ref={wrap} className="relative h-[1500svh]">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <ClientOnly fallback={<div className="h-full w-full" style={{ background: "var(--gradient-night)" }} />}>
            <BirthdayScene fireworksActive={fireworks} progress={sceneProgress} />
          </ClientOnly>
        </div>

        {/* warm light leak that swells while the sky is burning */}
        <motion.div
          style={{ opacity: leak }}
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-screen [background:radial-gradient(ellipse_70%_50%_at_75%_20%,color-mix(in_oklab,var(--gold)_38%,transparent),transparent_70%)]"
        />

        {/* cool moonlight wash during the hushed opening act */}
        <motion.div
          style={{ opacity: coolWash }}
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-soft-light [background:radial-gradient(ellipse_80%_60%_at_68%_18%,color-mix(in_oklab,var(--sky)_45%,transparent),transparent_72%)]"
        />

        {/* fine film grain so the whole thing reads as projected footage */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='0.55'/></svg>\")",
          }}
        />

        {/* cinematic vignette + letterbox bars */}
        <motion.div style={{ opacity: vignette }} className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="h-full w-full [background:radial-gradient(ellipse_at_center,transparent_45%,var(--night-deep)_100%)]" />
        </motion.div>
        <motion.div style={{ height: barH }} className="pointer-events-none absolute inset-x-0 top-0 bg-night-deep" aria-hidden />
        <motion.div style={{ height: barH }} className="pointer-events-none absolute inset-x-0 bottom-0 bg-night-deep" aria-hidden />

        {/* scroll-timed captions — four quiet beats, then the sky catches */}
        <div className="pointer-events-none absolute inset-0">
          <Cue progress={p} range={[-0.06, 0.09]} kicker="" className="top-[40%] text-center">
            <p className="mx-auto max-w-md font-display text-2xl italic leading-snug text-foreground/80 sm:text-3xl">
              So..pyaree bachee as you know mujhe apke pyare sapnee kafii jyada pyare hai
            </p>
          </Cue>

          <Cue
            progress={p}
            range={[0.1, 0.19]}
            kicker=""
            align="left"
            className="top-[30%] text-center sm:text-left sm:pl-24"
          >
            <p className="mx-auto max-w-sm font-display text-3xl leading-tight text-foreground/85 sm:mx-0 sm:text-4xl">
              and isiliyee menee sochaa saydd reality nah sahii🫠
            </p>
          </Cue>

          <Cue
            progress={p}
            range={[0.2, 0.28]}
            kicker=""
            align="right"
            className="top-[58%] text-center sm:text-right sm:pr-24"
            drift={120}
          >
            <p className="mx-auto max-w-sm font-display text-3xl leading-tight text-foreground/85 sm:ml-auto sm:mr-0 sm:text-4xl">
              atleast kisi tarah wo sapne todhe se hi shi sach kr saku🤧
            </p>
          </Cue>

          <Cue progress={p} range={[0.29, 0.355]} kicker="" className="top-[34%] text-center">
            <p className="mx-auto max-w-lg font-display text-3xl italic leading-tight text-foreground/85 sm:text-4xl">
              ik ye kuch khas nii cutie ji still mere taraf see👀🫀
            </p>
          </Cue>

          <Cue progress={p} range={[0.37, 0.47]} kicker="" className="top-[24%] text-center">
            <p className="mx-auto max-w-md font-display text-3xl leading-tight text-foreground/85 sm:text-4xl">
              
            </p>
          </Cue>

          <Cue
            progress={p}
            range={[0.49, 0.6]}
            kicker=""
            align="right"
            className="top-[62%] text-center sm:text-right sm:pr-24"
            drift={130}
          >
            <p className="mx-auto max-w-sm font-display text-3xl leading-tight text-foreground/85 sm:ml-auto sm:mr-0 sm:text-4xl">
          
            </p>
          </Cue>

          <Cue progress={p} range={[0.62, 0.73]} kicker="" className="top-[34%] text-center">
            <p className="mx-auto max-w-lg font-display text-3xl italic leading-tight text-foreground/85 sm:text-4xl">
              
            </p>
          </Cue>

          <Cue progress={p} range={[0.75, 0.86]} kicker="eight" className="top-[38%] text-center">
            <p className="mx-auto max-w-lg font-display text-3xl italic leading-tight text-gradient-gold sm:text-5xl">
              Humesha khush rahiye bache💓🫶🏻
            </p>
          </Cue>
        </div>

        {/* finale title */}
        <motion.div
          style={{ opacity: finaleOpacity, scale: finaleScale }}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <div
            aria-hidden
            className="absolute inset-0 [background:radial-gradient(ellipse_55%_38%_at_center,color-mix(in_oklab,var(--night-deep)_90%,transparent),transparent_72%)]"
          />
          <p className="relative text-[0.62rem] uppercase tracking-[0.42em] text-gold/80">ik ye kuch khas ni tha still🤧</p>
          <h1 className="relative mt-5 font-display text-5xl font-light leading-[1.05] sm:text-7xl lg:text-8xl">
            {title.map((ch, i) => (
              <span key={i} className="text-gradient-gold inline-block">
                {ch === " " ? "\u00A0" : ch}
              </span>
            ))}
          </h1>
          <motion.p
            style={{ opacity: outroOpacity }}
            className="relative mt-6 max-w-lg font-display text-lg italic text-foreground/75 sm:text-xl"
          >
             &amp; 
          </motion.p>
        </motion.div>

        {/* scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3"
        >
          <span className="text-[0.55rem] uppercase tracking-[0.5em] text-gold/70">scroll to play</span>
          <span className="h-10 w-px bg-gradient-to-b from-gold/70 to-transparent" />
        </motion.div>

        {/* progress bar / "scrubber" */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border/50">
          <motion.div style={{ scaleX: p }} className="h-px origin-left bg-gradient-to-r from-gold via-rose to-sky" />
        </div>
      </div>
    </div>
  );
}

function Index() {
  return (
    <main className="relative bg-night-deep">
      <Film />
    </main>
  );
}
