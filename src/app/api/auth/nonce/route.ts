import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { CreavaultSession, sessionOptions } from "@/lib/session";

function randomNonce(): string {
  // 16 random bytes → 32 hex chars, plenty for replay protection
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET() {
  const session = await getIronSession<CreavaultSession>(
    await cookies(),
    sessionOptions
  );
  session.nonce = randomNonce();
  await session.save();
  return new Response(session.nonce, {
    headers: { "content-type": "text/plain" },
  });
}
