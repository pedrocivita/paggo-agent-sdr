import type { Metadata } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import "./paggo.css";
import "./app.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Paggo · fale com a gente",
  description: "Case: agente de voz que pesquisa o lead antes de conversar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-theme="dark" className={outfit.variable}>
      <body>
        <div className="doc">
          <header className="masthead">
            <Link className="brand" href="/">Paggo</Link>
            <span>agente de pré-vendas · case</span>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
