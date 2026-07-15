import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Sprinkles and the Rainbow Gem",
    description: "A cheerful, child-friendly magical cave adventure starring Sprinkles the lavender cat.",
    openGraph: {
      title: "Sprinkles and the Rainbow Gem",
      description: "Collect stars and magic hats, then find the Rainbow Gem!",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024 }]
    },
    twitter: {
      card: "summary_large_image",
      title: "Sprinkles and the Rainbow Gem",
      description: "Collect stars and magic hats, then find the Rainbow Gem!",
      images: [`${origin}/og.png`]
    }
  };
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
