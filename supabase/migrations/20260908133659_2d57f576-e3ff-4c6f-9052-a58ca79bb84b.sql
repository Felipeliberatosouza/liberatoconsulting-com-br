UPDATE public.economic_indicators
SET label = 'Risco-país (CDS 5 anos)',
    note = 'O CDS soberano de 5 anos mede o custo de proteção contra calote da dívida brasileira: quanto menor, melhor a percepção de risco.',
    source_name = 'World Government Bonds (CDS soberano 5 anos)',
    source_url = 'https://www.worldgovernmentbonds.com/cds-historical-data/brazil/5-years/',
    updated_at = now()
WHERE slug = 'risco-pais';