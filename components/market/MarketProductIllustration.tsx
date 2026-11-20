"use client";

import * as React from "react";
import type { MarketProductId } from "@/lib/mock-market";
import { cn } from "@/lib/utils";

export function MarketProductIllustration({
  id,
  className,
}: {
  id: MarketProductId;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");

  if (id === "ankara") {
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <ellipse cx="120" cy="176" rx="76" ry="10" fill="#D9C5A0" opacity=".45" />
        <rect x="44" y="138" width="152" height="32" rx="12" fill="#B63A1E" />
        <path
          d="M64 138l12 16-12 16-12-16Zm26 0 12 16-12 16-12-16Zm26 0 12 16-12 16-12-16Zm26 0 12 16-12 16-12-16Zm26 0 12 16-12 16-12-16Z"
          fill="#FFFDF7"
          opacity=".88"
        />
        <circle cx="64" cy="154" r="3" fill="#B63A1E" />
        <circle cx="90" cy="154" r="3" fill="#B63A1E" />
        <circle cx="116" cy="154" r="3" fill="#B63A1E" />
        <circle cx="142" cy="154" r="3" fill="#B63A1E" />
        <circle cx="168" cy="154" r="3" fill="#B63A1E" />

        <rect x="42" y="110" width="156" height="32" rx="12" fill="#134D38" />
        <circle cx="62" cy="126" r="8" fill="none" stroke="#F2B84B" strokeWidth="3.2" />
        <circle cx="88" cy="126" r="8" fill="none" stroke="#F2B84B" strokeWidth="3.2" />
        <circle cx="114" cy="126" r="8" fill="none" stroke="#F2B84B" strokeWidth="3.2" />
        <circle cx="140" cy="126" r="8" fill="none" stroke="#F2B84B" strokeWidth="3.2" />
        <circle cx="166" cy="126" r="8" fill="none" stroke="#F2B84B" strokeWidth="3.2" />

        <rect x="44" y="82" width="152" height="32" rx="12" fill="#E8D8B7" />
        <path
          d="M52 104l10-16 10 16 10-16 10 16 10-16 10 16 10-16 10 16 10-16 10 16 10-16 10 16 10-16"
          fill="none"
          stroke="#6A2B5E"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52 110l10-14 10 14 10-14 10 14 10-14 10 14 10-14 10 14 10-14 10 14 10-14 10 14 10-14"
          fill="none"
          stroke="#C4562F"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <rect x="46" y="54" width="148" height="32" rx="12" fill="#DDA032" />
        <path
          d="M66 56l11 14-11 14-11-14Zm26 0 11 14-11 14-11-14Zm26 0 11 14-11 14-11-14Zm26 0 11 14-11 14-11-14Zm26 0 11 14-11 14-11-14Z"
          fill="#182720"
          opacity=".75"
        />
        <circle cx="66" cy="70" r="3" fill="#DDA032" />
        <circle cx="92" cy="70" r="3" fill="#DDA032" />
        <circle cx="118" cy="70" r="3" fill="#DDA032" />
        <circle cx="144" cy="70" r="3" fill="#DDA032" />
        <circle cx="170" cy="70" r="3" fill="#DDA032" />
      </svg>
    );
  }

  if (id === "shea") {
    const gradId = `shea-jar-${uid}`;
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#AE6D28" />
            <stop offset="0.35" stopColor="#CF8C39" />
            <stop offset="0.75" stopColor="#B87429" />
            <stop offset="1" stopColor="#854E17" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="172" rx="74" ry="12" fill="#D9C5A0" opacity=".5" />
        <rect x="74" y="58" width="92" height="108" rx="16" fill={`url(#${gradId})`} />
        <rect x="69" y="42" width="102" height="22" rx="6" fill="#C9A26B" />
        <rect x="74" y="64" width="92" height="5" fill="#7D4915" opacity=".32" />
        <rect
          x="87"
          y="88"
          width="66"
          height="40"
          rx="5"
          fill="#FDF6E4"
          stroke="#E7DFCC"
          strokeWidth="1.5"
        />
        <path
          d="M120 96l14 12-14 12-14-12Z"
          fill="none"
          stroke="#237455"
          strokeWidth="2.2"
        />
        <circle cx="120" cy="108" r="3" fill="#C4562F" />
        <ellipse cx="52" cy="166" rx="14" ry="8" fill="#5D371B" />
        <ellipse cx="68" cy="160" rx="11" ry="7" fill="#7A4A2B" />
        <path d="M156 168c0-10 10-16 20-16s20 6 20 16Z" fill="#FDF6E4" />
      </svg>
    );
  }

  if (id === "jollof") {
    const leftId = `jollof-l-${uid}`;
    const centerId = `jollof-c-${uid}`;
    const rightId = `jollof-r-${uid}`;
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <defs>
          <linearGradient id={leftId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DF662F" />
            <stop offset="1" stopColor="#BA3F19" />
          </linearGradient>
          <linearGradient id={centerId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E66F33" />
            <stop offset="1" stopColor="#BE421B" />
          </linearGradient>
          <linearGradient id={rightId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D75826" />
            <stop offset="1" stopColor="#A93414" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="170" rx="78" ry="12" fill="#D9C5A0" opacity=".48" />
        <rect x="44" y="70" width="44" height="90" rx="8" fill="#F2DEC1" />
        <rect x="48" y="102" width="36" height="54" rx="4" fill={`url(#${leftId})`} />
        <rect x="40" y="60" width="52" height="13" rx="4" fill="#CBA36E" />
        <rect x="96" y="42" width="48" height="118" rx="9" fill="#F4E3C9" />
        <rect x="100" y="80" width="40" height="76" rx="5" fill={`url(#${centerId})`} />
        <rect x="92" y="32" width="56" height="14" rx="4" fill="#CBA36E" />
        <rect x="152" y="86" width="42" height="74" rx="8" fill="#F2DEC1" />
        <rect x="156" y="114" width="34" height="42" rx="4" fill={`url(#${rightId})`} />
        <rect x="148" y="76" width="50" height="12" rx="4" fill="#CBA36E" />
        <path d="M58 171c10-9 22-9 28 0-8 7-20 7-28 0Z" fill="#C4341C" />
        <path d="M110 174c8-6 18-6 24 0-6 6-16 6-24 0Z" fill="#1A5A3F" />
        <path d="M150 171c8-5 16-5 20 0-5 5-14 5-20 0Z" fill="#E8833A" />
      </svg>
    );
  }

  if (id === "plantain") {
    const pouchId = `plantain-pouch-${uid}`;
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <defs>
          <linearGradient id={pouchId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#BA8F55" />
            <stop offset="0.5" stopColor="#CEA46C" />
            <stop offset="1" stopColor="#A67A43" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="172" rx="80" ry="11" fill="#D9C5A0" opacity=".48" />
        <path
          d="M72 44h96l6 116a10 10 0 0 1-10 10H76a10 10 0 0 1-10-10Z"
          fill={`url(#${pouchId})`}
        />
        <path d="M72 44h96l-4-10H76Z" fill="#9E743D" />
        <ellipse cx="120" cy="100" rx="34" ry="22" fill="#FDF6E4" />
        <path
          d="M120 88l13 12-13 12-13-12Z"
          fill="none"
          stroke="#C4562F"
          strokeWidth="2.5"
        />
        {/* Crisp golden plantain chips at base */}
        <ellipse cx="52" cy="164" rx="14" ry="9" fill="#E9A83B" stroke="#C88A1D" strokeWidth="1.5" />
        <ellipse cx="80" cy="169" rx="16" ry="10" fill="#F2B84B" stroke="#C88A1D" strokeWidth="1.5" />
        <ellipse cx="118" cy="166" rx="17" ry="10" fill="#F6C96F" stroke="#C88A1D" strokeWidth="1.5" />
        <ellipse cx="154" cy="170" rx="15" ry="9" fill="#E9A83B" stroke="#C88A1D" strokeWidth="1.5" />
        <ellipse cx="182" cy="163" rx="14" ry="9" fill="#F2B84B" stroke="#C88A1D" strokeWidth="1.5" />
        <circle cx="80" cy="169" r="2" fill="#B87A18" opacity=".55" />
        <circle cx="118" cy="166" r="2" fill="#B87A18" opacity=".55" />
        <circle cx="154" cy="170" r="2" fill="#B87A18" opacity=".55" />
      </svg>
    );
  }

  if (id === "bonnet") {
    const bonnetId = `bonnet-silk-${uid}`;
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <defs>
          <radialGradient id={bonnetId} cx="42%" cy="32%" r="68%">
            <stop offset="0" stopColor="#26684E" />
            <stop offset="0.6" stopColor="#143D2C" />
            <stop offset="1" stopColor="#0B271B" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="168" rx="74" ry="10" fill="#D9C5A0" opacity=".48" />
        <path
          d="M64 134c-8-46 18-84 58-84s64 38 56 84Z"
          fill={`url(#${bonnetId})`}
        />
        <path
          d="M84 94c18-16 50-16 66 2"
          stroke="#4CA985"
          strokeOpacity=".35"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M92 114c16-10 38-10 52 2"
          stroke="#4CA985"
          strokeOpacity=".25"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="64" y="130" width="112" height="18" rx="9" fill="#E9A83B" />
        <path
          d="M78 131v16M92 131v16M106 131v16M120 131v16M134 131v16M148 131v16M162 131v16"
          stroke="#C88A1D"
          strokeWidth="1.8"
          opacity=".65"
        />
        <rect x="148" y="136" width="18" height="10" rx="4" fill="#FDF6E4" />
      </svg>
    );
  }

  if (id === "oil") {
    const bottleId = `oil-bottle-${uid}`;
    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <defs>
          <linearGradient id={bottleId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#9E6C1F" />
            <stop offset="0.38" stopColor="#DFA437" />
            <stop offset="0.72" stopColor="#BA7E22" />
            <stop offset="1" stopColor="#754911" />
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="172" rx="74" ry="11" fill="#D9C5A0" opacity=".48" />
        {/* Dropper cap */}
        <path d="M111 40c0-8 18-8 18 0v18h-18Z" fill="#261912" />
        <rect x="103" y="56" width="34" height="16" rx="4" fill="#3B2518" />
        {/* Amber bottle */}
        <path
          d="M98 72h44l8 18v66a10 10 0 0 1-10 10H100a10 10 0 0 1-10-10V90Z"
          fill={`url(#${bottleId})`}
        />
        <rect
          x="99"
          y="98"
          width="42"
          height="42"
          rx="5"
          fill="#FDF6E4"
          stroke="#E7DFCC"
          strokeWidth="1.5"
        />
        <path
          d="M120 108l11 11-11 11-11-11Z"
          fill="none"
          stroke="#237455"
          strokeWidth="2.2"
        />
        {/* Botanical seeds accent */}
        <path d="M52 162c8-8 22-4 28 8-12 6-24 2-28-8Z" fill="#261912" />
        <ellipse cx="176" cy="166" rx="14" ry="7" fill="#5D371B" />
      </svg>
    );
  }

  if (id === "beads") {
    const beads = [
      { cx: 120, cy: 52, r: 7, fill: "#F2B84B" },
      { cx: 141, cy: 56, r: 6.5, fill: "#C4562F" },
      { cx: 158, cy: 68, r: 7, fill: "#1A5A3F" },
      { cx: 169, cy: 86, r: 6.5, fill: "#F6F1E6" },
      { cx: 171, cy: 106, r: 7, fill: "#E8833A" },
      { cx: 162, cy: 126, r: 7, fill: "#5B44A8" },
      { cx: 146, cy: 142, r: 7.5, fill: "#F2B84B" },
      { cx: 128, cy: 150, r: 8, fill: "#134D38" },
      { cx: 112, cy: 150, r: 8, fill: "#C4562F" },
      { cx: 94, cy: 142, r: 7.5, fill: "#E9A83B" },
      { cx: 78, cy: 126, r: 7, fill: "#1A5A3F" },
      { cx: 69, cy: 106, r: 7, fill: "#F2B84B" },
      { cx: 71, cy: 86, r: 6.5, fill: "#C4562F" },
      { cx: 82, cy: 68, r: 7, fill: "#5B44A8" },
      { cx: 99, cy: 56, r: 6.5, fill: "#F6F1E6" },
    ] as const;

    return (
      <svg
        viewBox="0 0 240 200"
        aria-hidden="true"
        className={cn("h-full w-full max-w-[180px] select-none", className)}
      >
        <ellipse cx="120" cy="172" rx="70" ry="10" fill="#D9C5A0" opacity=".48" />
        <circle
          cx="120"
          cy="101"
          r="50"
          fill="none"
          stroke="#C88A1D"
          strokeWidth="2.2"
          opacity=".65"
        />
        {beads.map((b, i) => (
          <circle
            key={i}
            cx={b.cx}
            cy={b.cy}
            r={b.r}
            fill={b.fill}
            stroke="#182720"
            strokeOpacity=".12"
            strokeWidth="1"
          />
        ))}
        {/* Cluster drop */}
        <circle cx="120" cy="164" r="6" fill="#C4562F" />
        <circle cx="106" cy="158" r="5" fill="#F2B84B" />
        <circle cx="134" cy="158" r="5" fill="#E8833A" />
      </svg>
    );
  }

  const soapId = `soap-bar-${uid}`;
  return (
    <svg
      viewBox="0 0 240 200"
      aria-hidden="true"
      className={cn("h-full w-full max-w-[180px] select-none", className)}
    >
      <defs>
        <linearGradient id={soapId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#463225" />
          <stop offset="1" stopColor="#261912" />
        </linearGradient>
      </defs>
      <ellipse cx="116" cy="172" rx="74" ry="12" fill="#D9C5A0" opacity=".48" />
      <rect
        x="48"
        y="128"
        width="126"
        height="34"
        rx="10"
        transform="rotate(-1 111 145)"
        fill={`url(#${soapId})`}
      />
      <rect
        x="52"
        y="94"
        width="118"
        height="34"
        rx="10"
        transform="rotate(2 111 111)"
        fill="#39281D"
      />
      <rect
        x="54"
        y="60"
        width="114"
        height="34"
        rx="10"
        transform="rotate(-1.5 111 77)"
        fill={`url(#${soapId})`}
      />
      <circle cx="88" cy="76" r="2" fill="#C49A6C" opacity=".45" />
      <circle cx="136" cy="81" r="1.8" fill="#C49A6C" opacity=".35" />
      <circle cx="102" cy="112" r="2.2" fill="#C49A6C" opacity=".4" />
      <circle cx="144" cy="144" r="2" fill="#C49A6C" opacity=".4" />
      <path d="M174 134c0-26 10-46 22-56 6 22 2 44-16 60Z" fill="#1E6245" />
      <path
        d="M178 134l13-48"
        stroke="#7FC7A6"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}
