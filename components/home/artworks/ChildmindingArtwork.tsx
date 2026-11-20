"use client";

import type { HeroArtworkParallax } from "@/components/home/HeroArtwork";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function ChildmindingArtwork({
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
      aria-label="A childminder and a young child stacking wooden blocks together on a sunlit play rug"
      className={cn(
        "block h-auto w-full select-none",
        paused && "svg-scene-paused",
      )}
    >
      <defs>
        <linearGradient id="littlesteps-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#143D2C" />
          <stop offset="1" stopColor="#0B2A1E" />
        </linearGradient>
        <linearGradient id="littlesteps-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBD98F" />
          <stop offset="1" stopColor="#E9A83B" />
        </linearGradient>
        <linearGradient id="littlesteps-dress" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8833A" />
          <stop offset="1" stopColor="#C4562F" />
        </linearGradient>
        <linearGradient id="littlesteps-jumper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2B84B" />
          <stop offset="1" stopColor="#C88A1D" />
        </linearGradient>
        <pattern
          id="littlesteps-lattice"
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

      <rect width="600" height="760" fill="url(#littlesteps-bg)" />

      {/* Background plane: lattice, wall bunting, child wall art & ambient sparkles */}
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
          fill="url(#littlesteps-lattice)"
        />

        {/* Cozy wall bunting banner */}
        <g className="svg-bunting-sway">
          <path
            d="M64 172Q130 202 196 172"
            stroke="#C88A1D"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M76 178l16 3-7 20Z" fill="#C4562F" />
          <path d="M104 185l17 1-8 21Z" fill="#F2B84B" />
          <path d="M134 186l17-1-9 21Z" fill="#F6F1E6" />
          <path d="M164 181l16-3-9 20Z" fill="#2E8B6A" />
        </g>

        {/* Framed nursery sun-and-star picture */}
        <rect
          x="82"
          y="224"
          width="96"
          height="116"
          rx="10"
          fill="none"
          stroke="#C88A1D"
          strokeWidth="2.5"
        />
        <circle cx="130" cy="282" r="18" fill="#F2B84B" opacity=".9" />
        <path
          d="M130 250l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
          fill="#FDF0C8"
        />
        <circle cx="102" cy="314" r="5" fill="#C4562F" />
        <circle cx="156" cy="252" r="4" fill="#2E8B6A" />

        <g fill="#F2B84B" opacity=".5" className="svg-mote-a">
          <circle cx="212" cy="116" r="3" />
          <circle cx="76" cy="408" r="2.5" />
          <circle cx="318" cy="84" r="2" />
        </g>
        <g fill="#F2B84B" opacity=".5" className="svg-mote-b">
          <circle cx="520" cy="90" r="2.5" />
          <circle cx="556" cy="466" r="3" />
        </g>
      </motion.g>

      {/* Light plane: sun halo, arched nursery window & hanging mobile */}
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
          fill="url(#littlesteps-window)"
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

        {/* Hanging nursery mobile inside upper window arch */}
        <g className="svg-mobile-sway">
          <path
            d="M445 142v40"
            stroke="#8A5A12"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M418 182h54"
            stroke="#8A5A12"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M422 182v24M468 182v28" stroke="#8A5A12" strokeWidth="1.5" />
          <circle cx="422" cy="212" r="7" fill="#C4562F" />
          <path
            d="M468 202l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"
            fill="#C88A1D"
          />
          <circle cx="445" cy="182" r="3.5" fill="#F2B84B" />
        </g>
      </motion.g>

      {/* Anchored floor plane */}
      <rect y="600" width="600" height="160" fill="#0A241A" />
      <path d="M0 600h600" stroke="#F2B84B" strokeOpacity=".12" />

      {/* Foreground plane: shadows, plant, woven play rug, block tower, child & childminder */}
      <motion.g
        style={
          parallax ? { x: parallax.frontX, y: parallax.frontY } : undefined
        }
      >
        <ellipse cx="310" cy="694" rx="188" ry="18" fill="#000" opacity=".25" />

        {/* Circular woven play rug */}
        <ellipse cx="308" cy="682" rx="200" ry="26" fill="#1A5A3F" />
        <ellipse
          cx="308"
          cy="682"
          rx="184"
          ry="19"
          fill="none"
          stroke="#F2B84B"
          strokeOpacity=".35"
          strokeWidth="2"
          strokeDasharray="6 6"
        />

        {/* Potted plant shifted left cleanly out of play rug */}
        <g transform="translate(-26 0)">
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
        </g>

        {/* Wooden block tower base */}
        <g className="svg-block-tower">
          <rect x="275" y="636" width="34" height="30" rx="5" fill="#2E8B6A" />
          <rect x="277" y="608" width="30" height="28" rx="5" fill="#F6F1E6" />
          <circle cx="292" cy="622" r="4.5" fill="#F2B84B" />
        </g>

        {/* Seated young child stacking wooden blocks */}
        <g className="svg-toddler-body">
          <g className="svg-toddler-leg">
            <path
              d="M214 646Q244 654 256 664"
              stroke="#143D2C"
              strokeWidth="15"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="260" cy="664" r="8" fill="#C4562F" />
          </g>
          <rect
            x="192"
            y="546"
            width="48"
            height="98"
            rx="22"
            fill="url(#littlesteps-jumper)"
          />
          <rect x="210" y="534" width="16" height="14" fill="#7A4A2B" />

          <g className="svg-toddler-head">
            <circle cx="196" cy="494" r="15" fill="#241610" />
            <circle cx="238" cy="494" r="15" fill="#241610" />
            <circle cx="204" cy="503" r="4" fill="#E8833A" />
            <circle cx="230" cy="503" r="4" fill="#E8833A" />
            <circle cx="218" cy="510" r="26" fill="#241610" />
            <circle cx="220" cy="516" r="23" fill="#7A4A2B" />
            <path
              d="M210 515q3-3 6 0M225 515q3-3 6 0M214 526q5 5 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Articulated stacking arm + held terracotta block */}
          <g className="svg-toddler-arm">
            <path
              d="M234 568Q246 580 256 592"
              stroke="#7A4A2B"
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-toddler-forearm">
              <path
                d="M256 592Q268 602 278 610"
                stroke="#7A4A2B"
                strokeWidth="12"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="278" cy="610" r="6.5" fill="#7A4A2B" />
              <g className="svg-held-block">
                <rect
                  x="269"
                  y="595"
                  width="26"
                  height="26"
                  rx="5"
                  fill="#C4562F"
                />
                <circle cx="282" cy="608" r="4" fill="#F2B84B" />
              </g>
            </g>
          </g>
        </g>

        {/* Floor cushion + seated childminder */}
        <ellipse cx="408" cy="670" rx="62" ry="18" fill="#8A5A12" />

        <g className="svg-carer-body">
          <path
            d="M352 670c2-76 14-142 30-174 10-20 40-20 50 0 16 32 28 98 30 174Z"
            fill="url(#littlesteps-dress)"
          />
          <path
            d="M388 486q18 14 36 0"
            stroke="#F6F1E6"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M372 552c22 10 46 10 68 0"
            stroke="#F2B84B"
            strokeWidth="4"
            opacity=".65"
            fill="none"
          />
          <rect x="398" y="462" width="16" height="16" fill="#7A4A2B" />

          <g className="svg-carer-head">
            <circle cx="424" cy="416" r="18" fill="#241610" />
            <circle cx="419" cy="424" r="5" fill="#F2B84B" />
            <circle cx="402" cy="440" r="29" fill="#241610" />
            <circle cx="402" cy="444" r="26" fill="#7A4A2B" />
            <circle
              cx="426"
              cy="452"
              r="4.5"
              fill="none"
              stroke="#F2B84B"
              strokeWidth="2.5"
            />
            <path
              d="M389 443q4-3 8 0M407 443q4-3 8 0M396 455q5 5 10 0"
              stroke="#2A1810"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Encouraging left arm gesturing toward child's tower */}
          <g className="svg-carer-arm-left">
            <path
              d="M382 504Q370 522 362 540"
              stroke="#7A4A2B"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <g className="svg-carer-forearm-left">
              <path
                d="M362 540Q344 552 332 562"
                stroke="#7A4A2B"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="332" cy="562" r="7.5" fill="#7A4A2B" />
            </g>
          </g>

          {/* Right arm holding open picture book */}
          <g className="svg-carer-arm-right">
            <path
              d="M430 510Q442 544 432 574"
              stroke="#7A4A2B"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M406 566L432 560L458 566L454 584L432 578L410 584Z"
              fill="#F6F1E6"
              stroke="#C88A1D"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M432 560v18"
              stroke="#C88A1D"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="432" cy="574" r="7.5" fill="#7A4A2B" />
          </g>
        </g>

        {/* Tower placement celebration star glints */}
        <g className="svg-tower-glint-a">
          <path
            d="M307 551l2.4 6.6L316 560l-6.6 2.4L307 569l-2.4-6.6L298 560l6.6-2.4Z"
            fill="#FDF0C8"
          />
        </g>
        <g className="svg-tower-glint-b">
          <path
            d="M328 568l1.6 4.4L334 574l-4.4 1.6L328 580l-1.6-4.4L322 574l4.4-1.6Z"
            fill="#F2B84B"
          />
        </g>
      </motion.g>
    </svg>
  );
}
