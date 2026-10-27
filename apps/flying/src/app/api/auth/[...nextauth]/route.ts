import { getSite } from "@jerryqiu/sites";
import { NextResponse } from "next/server";

/** Auth.js endpoints are served by the hub only. */
const toHub = (request: Request) => NextResponse.redirect(`${getSite("hub").url}${new URL(request.url).pathname}`, 307);
export const GET = toHub;
export const POST = toHub;
