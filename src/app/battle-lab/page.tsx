import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BattleLab } from "./BattleLab";

export const metadata: Metadata = {
  title: "Battle lab (development only)",
  robots: { index: false },
};

/**
 * A bench for building the 3D battle scene: the scene, a play button and a
 * scrubber, nothing else. Development only; production builds answer 404.
 */
export default function BattleLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BattleLab />;
}
