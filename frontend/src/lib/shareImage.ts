import { OhangType } from "./spirits";
import { OhangScores } from "./ohang";

const OHANG_META: { key: OhangType; ohang: string; korName: string; stroke: string }[] = [
  { key: "wood",  ohang: "木", korName: "나무", stroke: "#4A7C4E" },
  { key: "fire",  ohang: "火", korName: "불",   stroke: "#C4532A" },
  { key: "soil",  ohang: "土", korName: "흙",   stroke: "#A0784A" },
  { key: "water", ohang: "水", korName: "물",   stroke: "#3A6B8A" },
  { key: "metal", ohang: "金", korName: "금",   stroke: "#8A8A6A" },
];

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function generateShareImage(
  scores: OhangScores,
  recommended: OhangType,
  spiritName: string,
  spiritPersonality: string,
  ohangKor: string,
  ohang: string,
  particleText: string,
): void {
  const W = 390, H = 580, S = 2;
  const canvas = document.createElement("canvas");
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(S, S);

  // 배경
  ctx.fillStyle = "#FDF8F5";
  ctx.fillRect(0, 0, W, H);

  // 상단 코랄 바
  ctx.fillStyle = "#E8896A";
  ctx.fillRect(0, 0, W, 5);

  // 앱 타이틀
  ctx.fillStyle = "#E8896A";
  ctx.font = "bold 11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("나를 채워주는 다섯 정령", W / 2, 30);

  ctx.fillStyle = "#3D2B1F";
  ctx.font = "bold 20px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText("내 사주 오행 분포", W / 2, 60);

  ctx.fillStyle = "#3D2B1F66";
  ctx.font = "12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText("생년월일로 계산한 오늘의 고유한 기운", W / 2, 82);

  // 구분선
  ctx.fillStyle = "#F5EDE8";
  ctx.fillRect(24, 96, W - 48, 1);

  // 오행 바 차트
  const maxScore = Math.max(...Object.values(scores), 1);
  const BAR_X = 110, BAR_W = 210, BAR_H = 13, BAR_R = 6;
  const ROW_H = 36, START_Y = 112;

  OHANG_META.forEach(({ key, ohang: oh, korName, stroke }, i) => {
    const y = START_Y + i * ROW_H;
    const score = scores[key];
    const pct = score / maxScore;
    const isRec = key === recommended;

    // 레이블
    ctx.fillStyle = isRec ? "#E8896A" : "#3D2B1F88";
    ctx.font = `${isRec ? "bold " : ""}13px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`${oh} ${korName}`, BAR_X - 10, y + 10);

    // 트랙
    ctx.fillStyle = "#F5EDE8";
    rrect(ctx, BAR_X, y, BAR_W, BAR_H, BAR_R);
    ctx.fill();

    // 채움
    const fillW = Math.max(BAR_W * pct, BAR_R * 2);
    ctx.fillStyle = isRec ? "#E8896A" : stroke + "88";
    rrect(ctx, BAR_X, y, fillW, BAR_H, BAR_R);
    ctx.fill();

    // 점수
    ctx.fillStyle = isRec ? "#E8896A" : "#3D2B1F55";
    ctx.font = `${isRec ? "bold " : ""}11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(String(score), BAR_X + BAR_W + 8, y + 10);
  });

  // 구분선
  const divY = START_Y + 5 * ROW_H + 10;
  ctx.fillStyle = "#F5EDE8";
  ctx.fillRect(24, divY, W - 48, 1);

  // 추천 카드 배경
  ctx.fillStyle = "#FDF0EA";
  rrect(ctx, 24, divY + 16, W - 48, 100, 16);
  ctx.fill();
  ctx.strokeStyle = "#F0D8CC";
  ctx.lineWidth = 1;
  rrect(ctx, 24, divY + 16, W - 48, 100, 16);
  ctx.stroke();

  ctx.fillStyle = "#C4785A88";
  ctx.font = "11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`네 사주에서 ${ohangKor}(${ohang}) 기운이 가장 적어`, W / 2, divY + 46);

  ctx.fillStyle = "#3D2B1F";
  ctx.font = "bold 17px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText(`${spiritName}${particleText} 오늘 채워주러 왔어`, W / 2, divY + 72);

  ctx.fillStyle = "#3D2B1F55";
  ctx.font = "11px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText(spiritPersonality, W / 2, divY + 94);

  // 하단 푸터
  ctx.fillStyle = "#F5EDE8";
  ctx.fillRect(0, H - 44, W, 44);
  ctx.fillStyle = "#E8896A";
  ctx.font = "bold 12px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("오행의 기운으로 오늘을 채워봐", W / 2, H - 24);
  ctx.fillStyle = "#E8896A88";
  ctx.font = "10px 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText("spirit-chat.vercel.app", W / 2, H - 8);

  const link = document.createElement("a");
  link.download = "오행분석결과.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
