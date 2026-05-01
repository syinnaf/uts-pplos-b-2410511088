const getPagination = (query) => {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const perPage = Math.min(Math.max(parseInt(query.per_page || '10', 10), 1), 100);
  const offset = (page - 1) * perPage;

  return {
    page,
    perPage,
    offset,
  };
};

const getPaginationMeta = (total, page, perPage) => {
  const totalPages = Math.ceil(total / perPage);

  return {
    total,
    page,
    per_page: perPage,
    total_pages: totalPages,
  };
};

module.exports = {
  getPagination,
  getPaginationMeta,
};