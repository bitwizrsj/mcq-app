import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".shared_mcqs.json");

// Helper to read data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
};

// Helper to write data
const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get("pin");

  if (!pin) {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
  }

  const data = readData();
  const set = data[pin.toUpperCase()];

  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(set);
}

export async function POST(req: Request) {
  try {
    const set = await req.json();
    if (!set || !set.sharePin) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const data = readData();
    data[set.sharePin.toUpperCase()] = set;
    writeData(data);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
