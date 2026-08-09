import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";

import { leadSchema, checkAntiSpam, hashIp, insertLead } from "./leads.server";

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const spam = checkAntiSpam(data);
    if (!spam.ok) {
      // Honeypot: responde como sucesso para não ensinar o bot.
      if (spam.reason === "spam") return { ok: true as const };
      return { ok: false as const, reason: spam.reason };
    }

    const ip = getRequestIP({ xForwardedFor: true });
    const ipHash = ip ? hashIp(ip) : null;
    return await insertLead(data, ipHash);
  });
