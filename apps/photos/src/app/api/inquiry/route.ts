import { handleInquiryRequest } from "@jerryqiu/inbox";
import { getSite } from "@jerryqiu/sites";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => handleInquiryRequest(request, { baseUrl: getSite("photos").url });
