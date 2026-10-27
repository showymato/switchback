import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { getFeaturedVehicles } from "@/server/queries/vehicles";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { HeroSequence, ScrollSequence, type SequenceFrame } from "@/components/landing/Sequence";
import { AnimScroll, SplitLines } from "@/components/landing/Anim";
import { Viewfinder } from "@/components/landing/Viewfinder";
import { BookTile, Camp, ProductTile, Treadmill } from "@/components/landing/Sections";

const IMG = {
  himalaya: "/images/hero-himalaya.jpg",
  pass: "/images/destination-himalayan-pass.jpg",
  valley: "/images/destination-himachal-valley.jpg",
};

/**
 * Optional footage: drop MP4s into public/videos/ and they replace the still-frame
 * fallbacks automatically — hero.mp4 (+ hero-portrait.mp4), scroll.mp4, treadmill.mp4.
 */
function video(name: string) {
  return fs.existsSync(path.join(process.cwd(), "public", "videos", name)) ? `/videos/${name}` : undefined;
}

// Landing photography — one file per slot in public/images/landing/ (credits in CREDITS.md).
const PHOTO = (name: string) => `/images/landing/${name}.jpg`;

const SCROLL_FRAMES: SequenceFrame[] = [
  { src: PHOTO("scroll-1"), position: "55% 60%" },
  { src: PHOTO("scroll-2"), position: "50% 70%" },
  { src: PHOTO("scroll-3"), position: "50% 55%" },
];

const TREADMILL_FRAMES: SequenceFrame[] = [
  { src: PHOTO("treadmill-1"), position: "60% 70%" },
  { src: PHOTO("treadmill-2"), position: "50% 78%" },
  { src: PHOTO("treadmill-3"), position: "50% 60%" },
];

const VIEWFINDER_POSITIONS = ["50% 80%", "50% 75%", "50% 40%", "70% 45%", "50% 55%", "50% 50%"];

const VIEWFINDER_TILES = Array.from({ length: 12 }, (_, i): SequenceFrame => ({
  src: PHOTO(`viewfinder-${(i % 6) + 1}`),
  position: VIEWFINDER_POSITIONS[i % 6],
}));

// Seconds → fraction of a 12.8s sequence, mirroring the original key timings.
const t = (s: number) => s / 12.8;

async function featured() {
  try {
    return await getFeaturedVehicles(6);
  } catch (err) {
    console.error("[landing] featured vehicles unavailable", err);
    return [];
  }
}

export default async function LandingPage() {
  const vehicles = await featured();
  const hero = video("hero.mp4");
  const heroPortrait = video("hero-portrait.mp4");

  return (
    <div className="min-h-svh">
      {/* ------------------------------------------------------------------ hero */}
      <HeroSequence
        video={hero ? { landscape: hero, portrait: heroPortrait } : undefined}
        poster={{ src: IMG.himalaya, position: "70% 45%" }}
        ui={
          <>
            <div className="sb-cine_subtitle">
              Verified rental partners in Manali. Clear pricing, documented pickup and return.{" "}
              <Link href="/how-it-works" className="underline">
                How it works.
              </Link>
            </div>
            <div className="sb-cine_hr" />
            <span className="sb-cine_before">Manali · Himachal</span>
            <div className="sb-cine_after">32°14′N 77°11′E</div>
          </>
        }
      >
        The road always asks for one more turn.
      </HeroSequence>

      {/* ------------------------------------------------- scroll-scrubbed story */}
      <ScrollSequence
        media={{ frames: SCROLL_FRAMES, video: video("scroll.mp4") }}
        folds={6.4}
        keys={[
          {
            from: t(0.5),
            to: t(6),
            children: (
              <BookTile
                className="sb-scroll-video_book"
                href="/vehicles"
                cta="Book now"
                head="Find your ride for the mountains."
              />
            ),
          },
          {
            from: t(3),
            to: t(6),
            children: (
              <article className="sb-video-content">
                <SplitLines lines={["Built for the", "high passes."]} className="sb-video-content_title" />
                <p className="sb-video-content_text">
                  Motorcycles, scooters, cars and SUVs from verified local partners. Deposits, included mileage and
                  cancellation terms are shown up front and locked in at checkout.
                </p>
                <div className="sb-video-content_after">
                  <Link href="/motorcycles" className="sb-button -transparent">
                    Motorcycles
                  </Link>
                  <Link href="/suvs" className="sb-button -transparent">
                    Cars &amp; SUVs
                  </Link>
                </div>
              </article>
            ),
          },
          {
            from: t(7),
            to: t(10),
            children: (
              <article className="sb-video-content">
                <SplitLines lines={["Manali,", "unhurried."]} className="sb-video-content_title" />
                <p className="sb-video-content_text">
                  Old Manali at dawn. Solang by noon. Pine ridgelines, river-carved valleys and passes that open and
                  close with the seasons. Conditions change fast at altitude, so check locally before you commit to a
                  route.
                </p>
                <div className="sb-video-content_after">
                  <Link href="/safety" className="sb-button -transparent">
                    Safety guidance
                  </Link>
                </div>
              </article>
            ),
          },
        ]}
      />

      {/* ------------------------------------------------------------ viewfinder */}
      <Viewfinder
        tag="Since day one"
        intro="Every partner on Switchback is reviewed before their first vehicle goes live, and every vehicle is checked before it can be booked. Pickup and return are documented, with odometer, fuel and photos, so the ride is the only surprise."
        title={{ mobile: ["Made", "for"], desktop: "Made for", words: ["the"], emphasis: "climb" }}
        tiles={VIEWFINDER_TILES}
      />

      {/* -------------------------------------------------------------- treadmill */}
      <Treadmill frames={TREADMILL_FRAMES} video={video("treadmill.mp4")} />

      {/* ------------------------------------------------------------------ camp */}
      <Camp
        lines={["For", "the rider", "in all", "of us."]}
        coordsBefore={"32°14'24.0\"N ↔ 77°11'20.0\"E"}
        coordsAfter={"34°09'08.0\"N ↔ 77°34'38.0\"E"}
        text="Some trips are planned to the hour. The best ones aren't. Switchback exists so the part before the road (finding a vehicle you can trust, at a price you can see) takes minutes, and the rest of the day belongs to the mountains."
        foreground={{ src: IMG.pass, position: "50% 70%" }}
        badge="Manali → Solang"
      />

      {/* --------------------------------------------------------- how it works */}
      <div className="sb-section-dust sb-dust sb-py-sm">
        <div className="sb-container">
          <div className="flex flex-col gap-6 pb-10 sm:flex-row sm:gap-4 md:pb-12">
            <AnimScroll as="h2" className="sb-h1 w-full sm:w-[55%] md:w-1/2">
              Built on verification, <br />
              not guesswork.
            </AnimScroll>
            <div className="sm:w-[45%] sm:pt-10 md:w-1/2">
              <AnimScroll as="p" delay={1} className="sb-body-grey max-w-[410px]">
                Every partner&apos;s business details and licensing documents are reviewed by an admin before their
                first vehicle can go live, and each vehicle is reviewed individually before it can be published.
              </AnimScroll>
            </div>
          </div>
          <div className="sb-steps">
            {[
              ["Partner verification", "Business details and licences are reviewed before any listing goes live."],
              ["Transparent terms", "Deposits, mileage and extra charges are locked into your booking at checkout."],
              ["Documented handover", "Pickup and return use a recorded checklist: odometer, fuel level, photos."],
              ["Support that's routed", "Raise a case from your booking; it reaches an admin with the full history."],
            ].map(([title, body], i) => (
              <AnimScroll key={title} delay={i} className="sb-step">
                <span className="sb-step_index">0{i + 1}</span>
                <div>
                  <h3 className="sb-step_title">{title}</h3>
                  <p>{body}</p>
                </div>
              </AnimScroll>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ duo */}
      <div className="sb-section-dust sb-dust sb-py-2xl">
        <div className="sb-container">
          <hr className="sb-fancy-hr" />
          <AnimScroll as="h2" className="sb-h1">
            The rides
            <br />
            that do it all.
          </AnimScroll>
        </div>
        <div className="sb-container-full">
          <div className="sb-duo">
            <ProductTile
              href="/motorcycles"
              image={IMG.himalaya}
              imagePosition="70% 45%"
              title="Motorcycles"
              subtitle="Made for the high passes."
            />
            <ProductTile
              href="/suvs"
              image={IMG.valley}
              imagePosition="50% 85%"
              title="Cars & SUVs"
              subtitle="Room for the whole crew."
              delay={1}
            />
          </div>
        </div>

        {vehicles.length > 0 && (
          <div className="sb-container mt-[clamp(5rem,4.43rem+2.86vw,7rem)]">
            <hr className="sb-fancy-hr" />
            <div className="mb-10 flex items-end justify-between gap-6">
              <AnimScroll as="h2" className="sb-h1">
                Ready to book.
              </AnimScroll>
              <AnimScroll delay={1}>
                <Link href="/vehicles" className="sb-button -light">
                  View all
                </Link>
              </AnimScroll>
            </div>
            <div className="sb-featured">
              {vehicles.map((item, i) => (
                <AnimScroll key={item.vehicle.id} delay={Math.min(i, 3)}>
                  <VehicleCard data={{ ...item, images: item.images.map((img) => ({ fileKey: img.fileKey })) }} />
                </AnimScroll>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- foot CTA */}
      <div className="my-[clamp(5rem,4.43rem+2.86vw,7rem)]">
        <section className="sb-container">
          <hr className="sb-fancy-hr" />
          <div className="sb-foot-cta_grid">
            <AnimScroll as="h2" className="sb-h1 sb-foot-cta_title">
              Your fleet. More journeys.
            </AnimScroll>
            <AnimScroll as="p" delay={1} className="sb-body-grey sb-foot-cta_text">
              Run a rental business in Manali? List your vehicles, manage availability and pricing, and receive
              bookings through one dashboard. Applications are reviewed before approval, and each vehicle is verified
              before it can be published.
            </AnimScroll>
            <AnimScroll delay={2} className="sb-foot-cta_action">
              <Link href="/partner" className="sb-button -light">
                List your fleet
              </Link>
            </AnimScroll>
          </div>
        </section>
        <AnimScroll as="section" className="sb-container" aria-labelledby="notes-heading">
          <hr className="sb-hr" />
          <h2 id="notes-heading" className="sr-only">
            Good to know
          </h2>
          <ol className="sb-notes">
            <li>
              <p>
                <strong>Is the security deposit refundable?</strong> Yes. It is returned after the return inspection,
                minus any confirmed additional charges you&apos;ve been shown evidence for.
              </p>
            </li>
            <li>
              <p>
                <strong>What documents do I need?</strong> A valid driving licence for the vehicle category and a
                government photo ID. Some vehicles list extra requirements; see{" "}
                <Link href="/rental-requirements" className="underline">
                  rental requirements
                </Link>
                .
              </p>
            </li>
            <li>
              <p>
                <strong>Can I cancel or change my booking?</strong> Yes, from your account. The refund depends on how
                close to pickup you cancel; see the{" "}
                <Link href="/cancellation-policy" className="underline">
                  cancellation policy
                </Link>
                , which is also shown before you pay.
              </p>
            </li>
            <li>
              <p>
                <strong>Road conditions.</strong> Switchback makes no claims about which roads or passes are open or
                permitted on a given day. Conditions change fast at altitude; check locally before you set out.
              </p>
            </li>
          </ol>
        </AnimScroll>
      </div>
    </div>
  );
}
