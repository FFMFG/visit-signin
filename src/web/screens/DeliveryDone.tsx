import { useEffect } from "react";
import { Layout } from "../components/Layout";

export function DeliveryDone({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <Layout title="Thanks!" subtitle="Receipt saved.">
      <div className="text-center text-white/70">Have a good one.</div>
    </Layout>
  );
}
