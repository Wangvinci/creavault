import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { CreavaultSession, sessionOptions } from "@/lib/session";

export async function GET() {
  const session = await getIronSession<CreavaultSession>(
    await cookies(),
    sessionOptions
  );
  return Response.json({
    address: session.address ?? null,
    chainId: session.chainId ?? null,
  });
}

export async function DELETE() {
  const session = await getIronSession<CreavaultSession>(
    await cookies(),
    sessionOptions
  );
  session.destroy();
  return Response.json({ ok: true });
}
