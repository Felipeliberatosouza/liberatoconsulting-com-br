import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/i18n";
import { AudienceFilterProvider } from "@/lib/audience-filters";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { CopyProtection } from "@/components/CopyProtection";
import { normalizeLang } from "@/lib/seo";
import { trackPageView } from "@/lib/gtag";
import { getPublicCompanyAddress } from "@/lib/company-public.functions";
import { postalAddressSchema } from "@/lib/company-address";




function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: () => getPublicCompanyAddress(),
  head: (ctx) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Liberato Consulting — Gestão estratégica com IA" },
      {
        name: "description",
        content:
          "Consultoria em gestão empresarial com inteligência artificial no centro de cada entrega.",
      },
      { name: "author", content: "Liberato Consulting" },
      {
        name: "google-site-verification",
        content: "0bFmwuonAC2cDrDPipONs6d4ZgjBXAdOg982BGMtnl4",
      },
      { property: "og:title", content: "Liberato Consulting — Gestão estratégica com IA" },

      {
        property: "og:description",
        content:
          "Gestão estratégica, empreendedorismo e pesquisas de mercado sobre o Brasil, com IA no centro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://www.googletagmanager.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
    scripts: [
      {
        type: "text/javascript",
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-44WQ42SD3T');
// Carrega o gtag.js fora do caminho crítico para não competir com o LCP.
(function(){var loaded=false;function load(){if(loaded)return;loaded=true;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=G-44WQ42SD3T';document.head.appendChild(s);}
if('requestIdleCallback' in window){window.requestIdleCallback(load,{timeout:4000});}else{setTimeout(load,3000);}
['pointerdown','keydown','touchstart','scroll'].forEach(function(e){window.addEventListener(e,load,{once:true,passive:true});});})();`,
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": ["Organization", "ProfessionalService"],
              "@id": "https://liberatoconsulting.com.br/#organization",
              name: "Liberato Consulting",
              alternateName: "Liberato Consulting Gestão Empresarial",
              url: "https://liberatoconsulting.com.br",
              logo: {
                "@type": "ImageObject",
                url: "https://liberatoconsulting.com.br/logo.png",
              },
              image: "https://liberatoconsulting.com.br/logo.png",
              email: "contato@liberatoconsulting.com.br",
              telephone: "+55 11 91325-8668",
              description:
                "Consultoria em gestão empresarial com inteligência artificial no centro de cada entrega.",
              address: postalAddressSchema(ctx.loaderData),
              areaServed: [
                { "@type": "Country", name: "Brasil" },
                { "@type": "Place", name: "Global" },
              ],
              knowsLanguage: ["pt-BR", "en", "es", "zh-Hans"],
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer service",
                  email: "contato@liberatoconsulting.com.br",
                  telephone: "+55 11 91325-8668",
                  availableLanguage: ["Portuguese", "English", "Spanish", "Chinese"],
                },
                {
                  "@type": "ContactPoint",
                  contactType: "human resources",
                  email: "parceria@liberatoconsulting.com.br",
                  availableLanguage: ["Portuguese", "English"],
                },
              ],
            },
            {
              "@type": "WebSite",
              "@id": "https://liberatoconsulting.com.br/#website",
              name: "Liberato Consulting",
              url: "https://liberatoconsulting.com.br",
              publisher: { "@id": "https://liberatoconsulting.com.br/#organization" },
              inLanguage: ["pt-BR", "en", "es", "zh-Hans"],
            },
          ],
        }),

      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const HTML_LANG: Record<string, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
  zh: "zh-Hans",
};

function RootShell({ children }: { children: ReactNode }) {
  const langParam = useRouterState({
    select: (s) => (s.location.search as Record<string, unknown> | undefined)?.["lang"],
  });
  const htmlLang = HTML_LANG[normalizeLang(langParam)] ?? "pt-BR";
  return (
    <html lang={htmlLang}>

      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RouteTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  useEffect(() => {
    trackPageView(pathname + search);
  }, [pathname, search]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <AudienceFilterProvider>
            <RouteTracker />
            <Outlet />
            <Toaster />
          </AudienceFilterProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AudienceFilterProvider>
        <RouteTracker />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <CopyProtection />
        <CookieConsent />
        <WhatsAppFloat />
        <Toaster />
      </AudienceFilterProvider>
        </LanguageProvider>
    </QueryClientProvider>
  );
}

