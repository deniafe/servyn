"use client";

import type { HeroArtworkParallax } from "@/components/home/HeroArtwork";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const POLE_STRIPES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function BarberArtwork({
  parallax,
  paused = false,
}: {
  parallax?: HeroArtworkParallax;
  paused?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 600 760"
      role="img"
      aria-label="A barber giving a client a clean skin fade haircut in a warm green studio"
      className={cn(
        "block h-auto w-full select-none",
        paused && "svg-scene-paused",
      )}
    >
      <defs>
        <linearGradient id="kingsman-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#143D2C" />
          <stop offset="1" stopColor="#0B2A1E" />
        </linearGradient>
        <linearGradient id="kingsman-mirror" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBD98F" />
          <stop offset="0.58" stopColor="#E9A83B" />
          <stop offset="1" stopColor="#B87A18" />
        </linearGradient>
        <pattern
          id="kingsman-lattice"
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
        <clipPath id="kingsman-pole-clip">
          <rect x="98" y="158" width="28" height="132" rx="14" />
        </clipPath>
        <clipPath id="kingsman-mirror-clip">
          <path d="M340 572V235a95 95 0 0 1 190 0v337Z" />
        </clipPath>
      </defs>

      <rect width="600" height="760" fill="url(#kingsman-bg)" />

      {/* Background plane: lattice, spinning barber pole & ambient sparkles */}
      <motion.g
        style={
          parallax ? { x: parallax.backX, y: parallax.backY } : undefined
        }
      >
        <rect
          x="-8"
          y="-8"
          width="616"
          height="776"
          fill="url(#kingsman-lattice)"
        />

        {/* Mounted spinning barber pole */}
        <g>
          <rect x="98" y="158" width="28" height="132" rx="14" fill="#F6F1E6" />
          <g clipPath="url(#kingsman-pole-clip)">
            <g className="svg-barber-stripes">
              {POLE_STRIPES.map((index) => {
                const y = 136 + index * 24;
                return (
                  <g key={index}>
                    <path
                      d={`M90 ${y + 10} 134 ${y - 2}v9L90 ${y + 19}Z`}
                      fill="#C4562F"
                    />
                    <path
                      d={`M90 ${y + 22} 134 ${y + 10}v5L90 ${y + 27}Z`}
                      fill="#1A5A3F"
                    />
                  </g>
                );
              })}
            </g>
          </g>
          <rect
            x="103"
            y="164"
            width="4.5"
            height="120"
            rx="2.25"
            fill="#FDF0C8"
            opacity=".32"
          />
          <rect x="92" y="148" width="40" height="10" rx="5" fill="#C88A1D" />
          <circle cx="112" cy="140" r="6" fill="#F2B84B" />
          <rect x="92" y="290" width="40" height="10" rx="5" fill="#C88A1D" />
          <circle cx="112" cy="306" r="5" fill="#F2B84B" />
        </g>

        <g fill="#F2B84B" opacity=".5" className="svg-mote-a">
          <circle cx="215" cy="112" r="3" />
          <circle cx="88" cy="410" r="2.5" />
          <circle cx="315" cy="76" r="2" />
        </g>
        <g fill="#F2B84B" opacity=".5" className="svg-mote-b">
          <circle cx="526" cy="96" r="2.5" />
          <circle cx="556" cy="458" r="3" />
        </g>
      </motion.g>

      {/* Light plane: sun halo, pendant lamp, arched studio mirror & barber shelf */}
      <motion.g
        style={
          parallax ? { x: parallax.lightX, y: parallax.lightY } : undefined
        }
      >
        <circle
          cx="450"
          cy="240"
          r="190"
          fill="#F2B84B"
          opacity=".08"
          className="svg-sun-halo"
        />

        {/* Ceiling pendant lamp */}
        <path
          d="M435 0v98"
          stroke="#C88A1D"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M416 98h38l10 18H406Z" fill="#C88A1D" />
        <circle cx="435" cy="122" r="9" fill="#FDF0C8" />
        <circle cx="435" cy="122" r="24" fill="#F2B84B" opacity=".16" />

        {/* Arched gold-framed studio mirror */}
        <path
          d="M340 572V235a95 95 0 0 1 190 0v337Z"
          fill="url(#kingsman-mirror)"
          stroke="#C88A1D"
          strokeWidth="3.5"
        />
        <g clipPath="url(#kingsman-mirror-clip)">
          <circle cx="435" cy="282" r="64" fill="#FDF0C8" opacity=".48" />
          <path
            d="M330 278 520 156v34L330 312Z"
            fill="#FDF0C8"
            opacity=".26"
          />
          <path
            d="M330 342 542 206v18L330 360Z"
            fill="#FDF0C8"
            opacity=".18"
          />
          <path
            d="M346 572V238a89 89 0 0 1 178 0v334"
            fill="none"
            stroke="#0E3527"
            strokeOpacity=".16"
            strokeWidth="4"
          />
        </g>

        {/* Barber station walnut shelf + spray bottle + neck brush */}
        <rect x="330" y="570" width="212" height="12" rx="6" fill="#8A5A12" />
        <rect x="484" y="536" width="18" height="34" rx="5" fill="#1A5A3F" />
        <rect x="489" y="528" width="8" height="9" rx="2" fill="#F2B84B" />
        <path
          d="M491 528h12"
          stroke="#F2B84B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="514" y="550" width="14" height="20" rx="4" fill="#C4562F" />
        <rect x="512" y="542" width="18" height="9" rx="3" fill="#FDF0C8" />
      </motion.g>

      {/* Anchored floor plane */}
      <rect y="600" width="600" height="160" fill="#0A241A" />
      <path d="M0 600h600" stroke="#F2B84B" strokeOpacity=".12" />

      {/* Foreground plane: shadows, plant, hydraulic barber chair, client & barber */}
      <motion.g
        style={
          parallax ? { x: parallax.frontX, y: parallax.frontY } : undefined
        }
      >
        <ellipse cx="310" cy="694" rx="158" ry="15" fill="#000" opacity=".25" />

        {/* Potted plant */}
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

        {/* Hydraulic swivel barber chair */}
        <ellipse cx="280" cy="690" rx="38" ry="8" fill="#6B4226" />
        <rect x="273" y="616" width="14" height="74" fill="#8A5A12" />
        <path
          d="M250 660h60M280 644v16"
          stroke="#C88A1D"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="234" y="486" width="92" height="114" rx="22" fill="#8F2F1B" />
        <rect x="242" y="582" width="76" height="22" rx="9" fill="#C4562F" />
        <rect x="228" y="538" width="16" height="50" rx="8" fill="#C4562F" />
        <rect x="316" y="538" width="16" height="50" rx="8" fill="#C4562F" />

        {/* Seated client in crisp barber cape */}
        <g className="svg-client-upper">
          <path d="M244 590Q246 492 280 486Q314 492 316 590Z" fill="#F6F1E6" />
          <path
            d="M266 512Q280 548 294 588"
            stroke="#E5DEC9"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="267" y="482" width="26" height="10" rx="5" fill="#F2B84B" />
          <rect x="272" y="466" width="16" height="18" fill="#7A4A2B" />

          <g className="svg-client-head">
            <path
              d="M252 444v-20a4 4 0 0 1 4-4h48a4 4 0 0 1 4 4v20Z"
              fill="#241610"
            />
            <rect x="252" y="438" width="56" height="10" fill="#3B2318" />
            <circle cx="280" cy="450" r="26" fill="#7A4A2B" />
            <path
              d="M257 458a24 22 0 0 0 46 0a23 20 0 0 1-46 0Z"
              fill="#241610"
            />
            <path
              d="M267 447q4 3 8 0M285 447q4 3 8 0M275 462q5 3 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Standing barber */}
        <g className="svg-barber-body">
          {/* Trousers */}
          <path
            d="M362 586h68l4 114h-28l-10-70-10 70h-28Z"
            fill="#241610"
          />
          {/* Crisp cream barber shirt */}
          <path
            d="M358 470c2-24 74-24 76 0l4 116H354Z"
            fill="#F6F1E6"
          />
          {/* Forest green barber apron */}
          <path
            d="M366 476h60l6 154H360Z"
            fill="#1A5A3F"
          />
          <path
            d="M374 452l-4 28M418 452l4 28"
            stroke="#C88A1D"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <rect
            x="376"
            y="538"
            width="40"
            height="28"
            rx="6"
            fill="#143D2C"
            stroke="#C88A1D"
            strokeWidth="2"
          />
          <rect x="388" y="422" width="16" height="24" fill="#7A4A2B" />

          <g className="svg-barber-head">
            <rect
              x="374"
              y="368"
              width="44"
              height="16"
              rx="6"
              fill="#241610"
            />
            <circle cx="396" cy="396" r="28" fill="#241610" />
            <circle cx="396" cy="404" r="25" fill="#7A4A2B" />
            <path
              d="M374 410a22 20 0 0 0 44 0a22 18 0 0 1-44 0Z"
              fill="#241610"
            />
            <path
              d="M385 400q4 3 8 0M401 400q4 3 8 0M391 414q5 3 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Left arm holding gold comb */}
          <g className="svg-barber-arm-left">
            <path
              d="M368 462Q352 466 338 468"
              stroke="#7A4A2B"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-barber-forearm-left">
              <path
                d="M338 468Q324 458 314 442"
                stroke="#7A4A2B"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <rect
                x="307"
                y="416"
                width="5"
                height="28"
                rx="2"
                fill="#F2B84B"
              />
              <path
                d="M307 420h-4M307 424h-4M307 428h-4M307 432h-4"
                stroke="#F2B84B"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="314" cy="442" r="7.5" fill="#7A4A2B" />
            </g>
          </g>

          {/* Right arm holding cordless clippers */}
          <g className="svg-barber-arm-right">
            <path
              d="M422 462Q428 480 428 496"
              stroke="#7A4A2B"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-barber-forearm-right">
              <path
                d="M428 496Q403 502 378 488"
                stroke="#7A4A2B"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M380 490l-16-12"
                stroke="#1F2421"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M364 478l-5-4"
                stroke="#F2B84B"
                strokeWidth="7"
                strokeLinecap="butt"
              />
              <circle cx="378" cy="488" r="7.5" fill="#7A4A2B" />
            </g>
          </g>
        </g>

        {/* Trim flecks & fade shine glints */}
        <g className="svg-trim-flecks">
          <circle cx="312" cy="442" r="2" fill="#241610" />
          <circle cx="319" cy="449" r="1.8" fill="#241610" />
          <circle cx="315" cy="456" r="1.5" fill="#241610" />
          <circle cx="324" cy="439" r="1.9" fill="#241610" />
          <circle cx="326" cy="454" r="1.6" fill="#241610" />
        </g>
        <g className="svg-fade-glint-a">
          <path
            d="M310 411l2.4 6.6L319 420l-6.6 2.4L310 429l-2.4-6.6L301 420l6.6-2.4Z"
            fill="#FDF0C8"
          />
        </g>
        <g className="svg-fade-glint-b">
          <path
            d="M322 432l1.6 4.4L328 438l-4.4 1.6L322 444l-1.6-4.4L316 438l4.4-1.6Z"
            fill="#F2B84B"
          />
        </g>
      </motion.g>
    </svg>
  );
}
