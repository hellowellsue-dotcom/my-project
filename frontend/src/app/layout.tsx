import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Character Chat",
  description: "5명의 개성 있는 캐릭터와 AI로 대화하는 웹 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
