import type { KioskStep } from "../types";
import { BigButton, Layout } from "../components/Layout";

export function Welcome({ go }: { go: (step: KioskStep) => void }) {
  return (
    <Layout title="Welcome to FFMFG" subtitle="Please let us know you're here.">
      <div className="grid gap-5">
        <BigButton onClick={() => go("citizenship")}>I'm here to visit</BigButton>
        <BigButton onClick={() => go("signout_pick")} variant="secondary">
          I'm leaving
        </BigButton>
        <BigButton onClick={() => go("delivery")} variant="ghost">
          Delivery / Pickup
        </BigButton>
      </div>
    </Layout>
  );
}
