import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DDD Restaurant Map - Diners, Drive-ins and Dives Locations",
  description: "Find restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map with verified locations, episode info, and current status.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
