import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나를 채워주는 다섯 정령",
  description: "생년월일로 오늘 내게 부족한 기운을 찾고 정령과 대화하며 채워봐",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* 다크모드 플래시 방지 — 하이드레이션 전 클래스 적용 */}
        <script dangerouslySetInnerHTML={{ __html: `try{const m=localStorage.getItem('app_mode')??"dark";if(m==="dark")document.documentElement.classList.add("dark")}catch(e){}` }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#0D0D14] transition-colors duration-300">{children}</body>
    </html>
  );
}
