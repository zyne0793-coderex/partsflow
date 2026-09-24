import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "PartsFlow | Spare parts catalog", description: "A clear home for your manufacturing spare parts." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
