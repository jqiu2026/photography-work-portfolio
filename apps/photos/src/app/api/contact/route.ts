import { handleContactRequest } from "@jerryqiu/inbox";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => handleContactRequest(request, "photos");
