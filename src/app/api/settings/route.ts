import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/store";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ ...settings, apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY) });
  } catch {
    return NextResponse.json({ error: "Could not read agent settings." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { instructions?: unknown; model?: unknown };
    if (typeof body.instructions !== "string" || body.instructions.length > 6000) {
      return NextResponse.json({ error: "Instructions must be text up to 6,000 characters." }, { status: 400 });
    }
    if (typeof body.model !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(body.model)) {
      return NextResponse.json({ error: "Enter a valid Gemini model ID." }, { status: 400 });
    }

    const settings = { instructions: body.instructions.trim(), model: body.model.trim() };
    await saveSettings(settings);
    return NextResponse.json({ ...settings, apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY) });
  } catch {
    return NextResponse.json({ error: "Could not save agent settings." }, { status: 400 });
  }
}