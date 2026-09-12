import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";

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
