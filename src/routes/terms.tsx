import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { seoPageMeta } from "@/lib/seo-meta";

export const Route = createFileRoute("/terms")({
  head: (ctx) => ({
    meta: [
      ...seoPageMeta("/terms", headLang(ctx), { ogType: "article" }),
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/terms", headLang(ctx)),
  }),
  component: () => <LegalPage doc="terms" />,
});
