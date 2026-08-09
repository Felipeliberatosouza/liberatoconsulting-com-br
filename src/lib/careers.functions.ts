import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

import { applicationSchema, checkAntiSpam, hashIp, saveApplication } from "./careers.server";

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data }) => {
    const spam = checkAntiSpam(data);
    if (!spam.ok) {
      if (spam.reason === "spam") return { ok: true as const };
      return { ok: false as const, reason: spam.reason };
    }

    const ip = getRequestIP({ xForwardedFor: true });
    const ipHash = ip ? hashIp(ip) : null;
    return await saveApplication(data, ipHash);
  });
