import { useQuery } from "@tanstack/react-query";
import { getSiteConfig } from "@/lib/admin.functions";
import defaultLogo from "@/assets/fechou-logo.png.asset.json";

export function FechouLogo() {
  const config = useQuery({ queryKey: ["fechou-branding"], queryFn: () => getSiteConfig(), staleTime: 0, refetchInterval: 60000, refetchOnWindowFocus: true });
  return <img src={config.data?.branding?.fechouLogoUrl || defaultLogo.url} alt="Fechou! CRM" className="h-10 w-auto max-w-48 object-contain" />;
}