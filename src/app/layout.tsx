import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Creavault — On-chain creator vault",
  description:
    "Upload your music, video, podcast and films. Get paid in crypto. Own your work forever.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#08080c] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
