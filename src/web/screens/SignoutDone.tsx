import { useEffect } from "react";
import { Layout } from "../components/Layout";

export function SignoutDone({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <Layout title="Have a great day!" subtitle="Please drop your badge at the front desk.">
      <div className="text-center text-white/70">Signed out.</div>
    </Layout>
  );
}
