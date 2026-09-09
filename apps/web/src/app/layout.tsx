import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { SWRProvider } from "@/components/providers/SWRProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warriors Management",
  description: "SaaS de gestion administrative et financière",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={outfit.className}>
        <SWRProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </SWRProvider>
      </body>
    </html>
  );
}
