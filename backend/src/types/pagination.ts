export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const normalizePagination = (
  page = 1,
  limit = 20,
): Required<PaginationQuery> & { offset: number } => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};

export const toPaginatedResult = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number,
): PaginatedResult<T> => ({
  items,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
