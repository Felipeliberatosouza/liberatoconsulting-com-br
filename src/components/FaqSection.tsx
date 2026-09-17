import { useLanguage } from "@/i18n";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FaqSection() {
  const { institutional } = useLanguage();
  const items = institutional.faq.filter((item) => item.question && item.answer);
  if (!items.length) return null;
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Perguntas frequentes</p>
          <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">O que você precisa saber antes de começar</h2>
        </div>
        <Accordion type="single" collapsible className="border-t border-border">
          {items.map((item, index) => (
            <AccordionItem key={`${item.question}-${index}`} value={`faq-${index}`}>
              <AccordionTrigger className="py-6 text-left text-base font-bold">
                <LinkifiedText text={item.question} />
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-line pb-6 leading-relaxed text-muted-foreground">
                <LinkifiedText text={item.answer} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}