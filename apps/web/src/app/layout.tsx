import type { Metadata } from "next";
import { headers } from "next/headers";
import { Outfit } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { SWRProvider } from "@/components/providers/SWRProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Warriors Management",
  description: "Le suivi des inscriptions, des paiements et de l'activité des centres de formation.",
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
          {/* Site public (landing, essai, informations légales) : sans menu ni barre de l'application. */}
          {headers().get("x-wm-public-site") === "1" ? children : <LayoutWrapper>{children}</LayoutWrapper>}
        </SWRProvider>
      </body>
    </html>
  );
}
