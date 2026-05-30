import type { LucideIcon } from "lucide-react";
import type { SVGProps } from "react";
import { Bus, Car, Bike, Footprints } from "lucide-react";

type ModeIcon = LucideIcon;

/** Simple cycle icon (lucide has no Bicycle in this version). */
function Cycle({ className, strokeWidth = 2, ...props }: SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M9 17.5h6M12 17.5V8l3-4H18" />
  </svg>
  );
}

export type TravelModeId = "two_wheeler" | "driving" | "transit" | "bicycling" | "walking";

export type TravelModeOption = {
  id: TravelModeId;
  labelKey: string;
  icon: ModeIcon;
};

/** Default for India blue-collar commute — bike / scooter. */
export const DEFAULT_TRAVEL_MODE: TravelModeId = "two_wheeler";

export const TRAVEL_MODE_OPTIONS: TravelModeOption[] = [
  { id: "two_wheeler", labelKey: "nearbyJobs.travel.twoWheeler", icon: Bike },
  { id: "driving", labelKey: "nearbyJobs.travel.car", icon: Car },
  { id: "transit", labelKey: "nearbyJobs.travel.bus", icon: Bus },
  { id: "bicycling", labelKey: "nearbyJobs.travel.cycle", icon: Cycle as ModeIcon },
  { id: "walking", labelKey: "nearbyJobs.travel.walk", icon: Footprints },
];
