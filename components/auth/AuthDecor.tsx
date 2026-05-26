"use client";

import { useTranslation } from "react-i18next";

export function DottedTrails() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <g
        fill="none"
        stroke="#1b52a4"
        strokeOpacity="0.18"
        strokeWidth="1.4"
        strokeDasharray="2 8"
        strokeLinecap="round"
      >
        <path d="M-20 120 C 240 60, 520 220, 820 140 S 1240 200, 1240 200" />
        <path d="M-20 380 C 200 320, 560 460, 900 360 S 1240 420, 1240 420" />
        <path d="M-20 640 C 260 580, 540 720, 880 620 S 1240 660, 1240 660" />
        <path d="M120 -20 C 240 200, 80 380, 220 560 S 200 800, 200 820" />
        <path d="M1040 -20 C 980 200, 1140 380, 1020 560 S 1080 800, 1080 820" />
      </g>
    </svg>
  );
}

export function WorkerBubbles() {
  const { t } = useTranslation();
  const bubbles = (t("decorative.bubbles", { returnObjects: true }) as { label: string; emoji: string }[]) ?? [];
  const positions = [
    "left-[6%] top-[14%] bg-yellow/30",
    "left-[28%] top-[28%] bg-sky/30",
    "left-[8%] bottom-[22%] bg-orange/30",
    "left-[22%] bottom-[8%] bg-primary/15",
    "left-[40%] bottom-[14%] bg-green/30",
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {bubbles.map((b, i) => (
        <div
          key={b.label}
          className={`absolute grid h-20 w-20 place-items-center rounded-full border-2 border-white shadow-md ring-1 ring-line ${positions[i] ?? ""}`}
        >
          <span className="text-3xl">{b.emoji}</span>
        </div>
      ))}
    </div>
  );
}
