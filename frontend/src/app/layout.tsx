import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나를 채워주는 다섯 정령",
  description: "생년월일로 오늘 내게 부족한 기운을 찾고 정령과 대화하며 채워봐",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark">
      <head>
        {/* 라이트모드 저장된 경우에만 dark 클래스 제거 */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('app_mode')==="light")document.documentElement.classList.remove("dark")}catch(e){}` }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0D0D14] transition-colors duration-300">{children}</body>
    </html>
  );
}
