/** Never silently publish a partial sitemap when a public query fails. */
export async function collectSitemapRows<T>(
  readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const size = 500;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await readPage(from, from + size - 1);
    if (error) throw new Error(`Sitemap public query failed: ${error.message}`);
    if (!data) throw new Error("Sitemap public query returned no data");
    rows.push(...data);
    if (data.length < size) return rows;
  }
}