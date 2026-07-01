export function readPagination(url: URL, options: { defaultSize?: number; min?: number; max?: number } = {}) {
  const defaultSize = options.defaultSize ?? 100;
  const min = options.min ?? 25;
  const max = options.max ?? 200;
  const pageSizeParam = url.searchParams.get("pageSize")?.trim().toLowerCase() || "";
  const all = pageSizeParam === "all" || pageSizeParam === "total";
  const pageInput = Number(url.searchParams.get("page") || 1);
  const page = all ? 1 : Number.isFinite(pageInput) ? Math.max(1, Math.floor(pageInput)) : 1;
  const pageSizeInput = Number(pageSizeParam || defaultSize);
  const pageSize = all ? undefined : Number.isFinite(pageSizeInput) ? Math.min(max, Math.max(min, Math.floor(pageSizeInput))) : defaultSize;
  return {
    page,
    pageSize,
    skip: pageSize ? (page - 1) * pageSize : undefined,
    take: pageSize,
    all,
  };
}

export function paginationMeta(total: number, pagination: ReturnType<typeof readPagination>) {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize ?? total,
    totalPages: pagination.pageSize ? Math.max(1, Math.ceil(total / pagination.pageSize)) : 1,
  };
}
