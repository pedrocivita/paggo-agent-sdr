import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Outfit } from "next/font/google";
import "./paggo.css";
import "./app.css";
import { ThemeToggle } from "./theme-toggle";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Paggo · fale com a gente",
  description: "Case: agente de voz que pesquisa o lead antes de conversar.",
};

// Applies the saved theme before the first paint, so a light choice does not flash dark.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script may change data-theme before React hydrates.
    <html lang="pt-BR" data-theme="dark" className={outfit.variable} suppressHydrationWarning>
      <body>
        <Script id="theme" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <div className="doc">
          <header className="masthead">
            <Link className="brand" href="/">Paggo</Link>
            <div className="end">
              <span>agente de pré-vendas · case</span>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
