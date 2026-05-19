import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adobe All Premium Software Bundle 2026 | Grabnext",
  description: "Get lifetime access to 15+ Adobe CC apps including Photoshop, Premiere Pro, Illustrator, and more. Pre-activated for Windows & Mac. One-time payment, no subscriptions!",
  openGraph: {
    title: "Adobe All Premium Software Bundle 2026 | Grabnext",
    description: "Get lifetime access to 15+ Adobe CC apps, pre-activated for Windows & Mac. One-time payment, no subscriptions!",
    type: "website",
  }
};

export default function SoftwareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
