import { NextRequest, NextResponse } from "next/server";
import { analyzeOhang } from "@/lib/ohang";

export async function POST(req: NextRequest) {
  try {
    const { year, month, day, hour, minute } = await req.json();

    if (
      typeof year !== "number" ||
      typeof month !== "number" ||
      typeof day !== "number" ||
      year < 1900 || year > 2100 ||
      month < 1 || month > 12 ||
      day < 1 || day > 31
    ) {
      return NextResponse.json({ error: "올바른 생년월일을 입력해줘." }, { status: 400 });
    }

    const hourVal   = (typeof hour   === "number" && hour   >= 0 && hour   <= 23) ? hour   : null;
    const minuteVal = (typeof minute === "number" && minute >= 0 && minute <= 59) ? minute : null;
    const result = analyzeOhang(year, month, day, hourVal, minuteVal);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "분석 중 오류가 발생했어." }, { status: 500 });
  }
}
