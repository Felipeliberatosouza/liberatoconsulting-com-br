import { Fragment } from "react";

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>()]+[^\s<>().,;:!?"']|[\w.+-]+@[\w-]+\.[\w.-]+)/gi;

function normalize(raw: string) {
  if (raw.includes("@") && !raw.startsWith("http")) return `mailto:${raw}`;
  if (raw.startsWith("www.")) return `https://${raw}`;
  return raw;
}

export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (index % 2 === 1) {
          const href = normalize(part);
          const isMail = href.startsWith("mailto:");
          return (
            <a
              key={`link-${index}`}
              href={href}
              target={isMail ? undefined : "_blank"}
              rel={isMail ? undefined : "noopener noreferrer"}
              className="font-medium text-accent underline underline-offset-4 hover:opacity-80 break-words"
            >
              {part}
            </a>
          );
        }
        return <Fragment key={`text-${index}`}>{part}</Fragment>;
      })}
    </>
  );
}
