update public.content_articles set slug = v.s from (values
 ('c057af2b-c417-4b8c-a54a-16b8d63d8136'::uuid,'dimensionar-mercado'),
 ('bca4f23d-10a0-4e72-90de-bfb1eff40555'::uuid,'priorizacao-projetos'),
 ('dd3c7a98-09df-4257-bfd1-46aa768985ed'::uuid,'unit-economics'),
 ('2f0cb027-fbc0-4140-8854-d603348aa10a'::uuid,'entrar-brasil'),
 ('79b60cb5-d6d0-4e38-885a-f1f0bab271fa'::uuid,'validar-mercado'),
 ('b86e91e0-2c92-40b0-8298-678571b51384'::uuid,'process-mining'),
 ('442c5555-ffbd-4392-b153-c055c27eaa18'::uuid,'rotina-sustenta')
) as v(id, s) where content_articles.id = v.id;