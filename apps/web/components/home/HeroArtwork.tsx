"use client";

import { motion, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { BarberArtwork } from "@/components/home/artworks/BarberArtwork";
import { ChildmindingArtwork } from "@/components/home/artworks/ChildmindingArtwork";

export type HeroArtworkScene = "amara" | "kingsman" | "littlesteps";

export interface HeroArtworkParallax {
  backX: MotionValue<number>;
  backY: MotionValue<number>;
  lightX: MotionValue<number>;
  lightY: MotionValue<number>;
  frontX: MotionValue<number>;
  frontY: MotionValue<number>;
}

export function HeroArtwork({
  scene = "amara",
  parallax,
  paused = false,
}: {
  scene?: HeroArtworkScene;
  parallax?: HeroArtworkParallax;
  paused?: boolean;
}) {
  if (scene === "kingsman") {
    return <BarberArtwork parallax={parallax} paused={paused} />;
  }
  if (scene === "littlesteps") {
    return <ChildmindingArtwork parallax={parallax} paused={paused} />;
  }

  return (
    <svg
      viewBox="0 0 600 760"
      role="img"
      aria-label="A woman braiding a girl’s hair in a warm green room"
      className={cn(
        "block h-auto w-full select-none",
        paused && "svg-scene-paused",
      )}
    >
      <defs>
        <linearGradient id="amara-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#143D2C" />
          <stop offset="1" stopColor="#0B2A1E" />
        </linearGradient>
        <linearGradient id="amara-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBD98F" />
          <stop offset="1" stopColor="#E9A83B" />
        </linearGradient>
        <linearGradient id="amara-dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B84B" />
          <stop offset="1" stopColor="#C88A1D" />
        </linearGradient>
        <pattern
          id="amara-lattice"
          width="46"
          height="46"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M23 0 46 23 23 46 0 23Z"
            fill="none"
            stroke="#F2B84B"
            strokeOpacity=".06"
          />
        </pattern>
      </defs>

      <rect width="600" height="760" fill="url(#amara-bg)" />

      {/* Background plane: architectural lattice, wall art & ambient sparkles */}
      <motion.g
        style={
          parallax ? { x: parallax.backX, y: parallax.backY } : undefined
        }
      >
        <rect x="-8" y="-8" width="616" height="776" fill="url(#amara-lattice)" />

        <rect
          x="72"
          y="168"
          width="104"
          height="140"
          rx="10"
          fill="none"
          stroke="#C88A1D"
          strokeWidth="2.5"
        />
        <path
          d="M124 196 156 238 124 280 92 238Z"
          fill="none"
          stroke="#E9A83B"
          strokeWidth="2"
        />
        <circle cx="124" cy="238" r="6" fill="#C4562F" />

        <g fill="#F2B84B" opacity=".5" className="svg-mote-a">
          <circle cx="200" cy="120" r="3" />
          <circle cx="80" cy="420" r="2.5" />
          <circle cx="320" cy="80" r="2" />
        </g>
        <g fill="#F2B84B" opacity=".5" className="svg-mote-b">
          <circle cx="520" cy="90" r="2.5" />
          <circle cx="560" cy="470" r="3" />
        </g>
      </motion.g>

      {/* Light plane: radial sun glow & arched studio window */}
      <motion.g
        style={
          parallax ? { x: parallax.lightX, y: parallax.lightY } : undefined
        }
      >
        <circle
          cx="460"
          cy="250"
          r="190"
          fill="#F2B84B"
          opacity=".08"
          className="svg-sun-halo"
        />

        <path
          d="M350 585V235a95 95 0 0 1 190 0v350Z"
          fill="url(#amara-window)"
          stroke="#C88A1D"
          strokeWidth="3"
        />
        <circle cx="445" cy="300" r="58" fill="#FDF0C8" opacity=".95" />
        <path
          d="M445 142v443M350 330h190M350 460h190"
          stroke="#0E3527"
          strokeOpacity=".22"
          strokeWidth="7"
        />
        <rect x="338" y="583" width="214" height="12" rx="6" fill="#8A5A12" />
      </motion.g>

      {/* Anchored floor plane */}
      <rect y="600" width="600" height="160" fill="#0A241A" />
      <path d="M0 600h600" stroke="#F2B84B" strokeOpacity=".12" />

      {/* Foreground plane: shadows, plant, table, girl & stylist */}
      <motion.g
        style={
          parallax ? { x: parallax.frontX, y: parallax.frontY } : undefined
        }
      >
        <ellipse cx="300" cy="694" rx="150" ry="15" fill="#000" opacity=".25" />
        <ellipse cx="520" cy="694" rx="60" ry="9" fill="#000" opacity=".2" />

        <g className="svg-plant-leaves">
          <path
            d="M138 606C120 560 118 520 138 488c20 32 18 72 0 118Z"
            fill="#2E8B6A"
          />
          <path
            d="M138 606c-34-30-50-58-46-94 32 16 44 54 46 94Z"
            fill="#1A5A3F"
          />
          <path
            d="M138 606c34-30 50-58 46-94-32 16-44 54-46 94Z"
            fill="#237455"
          />
        </g>
        <path d="M96 618h84l-10 64h-64Z" fill="#C4562F" />
        <rect x="92" y="606" width="92" height="16" rx="8" fill="#E8833A" />

        <ellipse cx="520" cy="618" rx="46" ry="10" fill="#8A5A12" />
        <rect x="516" y="620" width="8" height="70" fill="#6B4226" />
        <ellipse cx="520" cy="692" rx="26" ry="6" fill="#6B4226" />
        <rect x="498" y="598" width="44" height="8" rx="3" fill="#F2B84B" />
        <path
          d="M502 606v9M510 606v9M518 606v9M526 606v9M534 606v9"
          stroke="#F2B84B"
          strokeWidth="3"
        />

        <path
          d="M240 610l-8 82M312 610l8 82"
          stroke="#6B4226"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <rect x="228" y="596" width="96" height="14" rx="7" fill="#8A5A12" />
        <path d="M240 596l12-56h56l12 56Z" fill="#C4562F" />
        <path
          d="M246 572h68"
          stroke="#8F2F1B"
          strokeWidth="3"
          opacity=".6"
        />

        {/* Child upper body & braided hair */}
        <g className="svg-child-upper">
          <rect x="250" y="474" width="60" height="76" rx="20" fill="#F6F1E6" />
          <g className="svg-child-arm">
            <path
              d="M256 496c-10 24-10 44-2 60"
              stroke="#7A4A2B"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="254" cy="558" r="7" fill="#7A4A2B" />
          </g>
          <rect x="272" y="468" width="16" height="14" fill="#7A4A2B" />
          <g className="svg-child-head">
            <circle cx="280" cy="440" r="31" fill="#241610" />
            <circle cx="280" cy="450" r="26" fill="#7A4A2B" />
            <g className="svg-braid-l-out">
              <path
                d="M254 436c-10 34-8 70-4 102"
                stroke="#241610"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="250" cy="542" r="4.5" fill="#F2B84B" />
            </g>
            <g className="svg-braid-l-in">
              <path
                d="M262 430c-8 40-6 80-2 114"
                stroke="#241610"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="260" cy="548" r="4.5" fill="#F2B84B" />
            </g>
            <g className="svg-braid-r-in">
              <path
                d="M298 430c8 40 6 80 2 114"
                stroke="#241610"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="300" cy="548" r="4.5" fill="#F2B84B" />
            </g>
            <g className="svg-braid-r-out">
              <path
                d="M306 436c10 34 8 70 4 102"
                stroke="#241610"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="310" cy="542" r="4.5" fill="#F2B84B" />
            </g>
            <path
              d="M266 452q4 4 8 0M286 452q4 4 8 0M276 464q5 4 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Standing stylist braiding */}
        <g className="svg-stylist-body">
          <path
            d="M336 700c-2-110 6-200 26-248 10-24 40-24 50 0 22 52 32 138 30 248Z"
            fill="url(#amara-dress)"
          />
          <path
            d="M352 520c24 14 48 14 72 0"
            stroke="#8A5A12"
            strokeWidth="6"
            opacity=".5"
            fill="none"
          />
          <rect x="380" y="420" width="16" height="16" fill="#7A4A2B" />
          <g className="svg-stylist-head">
            <circle cx="388" cy="392" r="32" fill="#C4562F" />
            <circle cx="388" cy="402" r="27" fill="#7A4A2B" />
            <circle cx="414" cy="372" r="10" fill="#C4562F" />
            <circle cx="421" cy="381" r="6" fill="#8F2F1B" />
            <g className="svg-stylist-earring">
              <circle
                cx="362"
                cy="410"
                r="5"
                fill="none"
                stroke="#F2B84B"
                strokeWidth="3"
              />
            </g>
            <path
              d="M377 404q4 4 8 0M395 404q4 4 8 0M383 416q5 4 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <g className="svg-arm-left">
            <path
              d="M366 452Q348 452 330 448"
              stroke="#7A4A2B"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-forearm-left">
              <path
                d="M330 448Q312 444 294 434"
                stroke="#7A4A2B"
                strokeWidth="15"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="294" cy="434" r="8" fill="#7A4A2B" />
            </g>
          </g>
          <g className="svg-arm-right">
            <path
              d="M410 452Q419 466 420 480"
              stroke="#7A4A2B"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-forearm-right">
              <path
                d="M420 480Q422 492 420 504"
                stroke="#7A4A2B"
                strokeWidth="15"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="420" cy="504" r="8" fill="#7A4A2B" />
              <g className="svg-held-strand">
                <path
                  d="M420 504c-4 16-2 32 4 44"
                  stroke="#241610"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="424" cy="552" r="4" fill="#F2B84B" />
              </g>
            </g>
          </g>
        </g>

        {/* Braid-finish glints */}
        <g className="svg-braid-glint-a">
          <path
            d="M328 477l2.4 6.6L337 486l-6.6 2.4L328 495l-2.4-6.6L319 486l6.6-2.4Z"
            fill="#FDF0C8"
          />
        </g>
        <g className="svg-braid-glint-b">
          <path
            d="M342 508l1.6 4.4L348 514l-4.4 1.6L342 520l-1.6-4.4L336 514l4.4-1.6Z"
            fill="#F2B84B"
          />
        </g>
      </motion.g>
    </svg>
  );
}
