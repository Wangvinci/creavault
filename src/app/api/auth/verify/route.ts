import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { verifyMessage, type Address } from "viem";
import { CreavaultSession, sessionOptions } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { message, signature, address } = (await req.json()) as {
      message: string;
      signature: `0x${string}`;
      address: Address;
    };
    const session = await getIronSession<CreavaultSession>(
      await cookies(),
      sessionOptions
    );

    // 1. Replay protection: nonce in message must match server-issued one.
    const nonceLine = message.split("\n").find((l) => l.startsWith("Nonce: "));
    const nonce = nonceLine?.slice("Nonce: ".length);
    if (!session.nonce || nonce !== session.nonce) {
      return Response.json({ ok: false, error: "bad nonce" }, { status: 401 });
    }

    // 2. Address in message must match the one the client claims.
    const addrLine = message.split("\n")[1];
    if (!addrLine || addrLine.toLowerCase() !== address.toLowerCase()) {
      return Response.json({ ok: false, error: "address mismatch" }, { status: 401 });
    }

    // 3. Cryptographic verification (works for both EOAs and EIP-1271 smart wallets
    //    once you swap to publicClient.verifyMessage; for EOAs viem's static verify is fine).
    const ok = await verifyMessage({ address, message, signature });
    if (!ok) {
      return Response.json({ ok: false, error: "invalid signature" }, { status: 401 });
    }

    session.address = address;
    session.issuedAt = new Date().toISOString();
    session.nonce = undefined;
    await session.save();

    return Response.json({ ok: true, address });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json({ ok: false, error: msg }, { status: 400 });
  }
}
