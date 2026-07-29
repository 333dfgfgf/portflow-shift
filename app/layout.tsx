import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
export const metadata: Metadata = {
  title: "BlueSync | 항만 예약 교환",
  description: "도착 예정 시간을 확인하고 더 효율적인 항만 예약 시간으로 교환하세요.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#082f63" };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ko"><body>{children}</body></html>;
}
