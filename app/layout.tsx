import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BREAK / ROOM — 벽돌깨기 웹 게임",
  description: "마우스, 키보드, 터치로 즐기는 감각적인 클래식 벽돌깨기 게임.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
