import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PortFlow Shift | AI 항만 예약 최적화",
  description: "도착 예측과 AI 예약 교환으로 항만 대기시간을 줄이는 스마트 운송 서비스",
  manifest: "/manifest.webmanifest",
  themeColor: "#073f3b",
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko"><body>{children}</body></html>;
}
