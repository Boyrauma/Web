export const PAGE_SIZE = 10;

export function getPageSlice(items, currentPage, pageSize = PAGE_SIZE) {
  const startIndex = (currentPage - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export default function AdminPagination({
  currentPage,
  onPageChange,
  totalItems,
  pageSize = PAGE_SIZE,
  itemLabel = "mục"
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const goToPage = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    onPageChange(nextPage);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3">
      <p className="text-sm text-admin-steel">
        Hiển thị <span className="font-bold text-admin-ink">{startItem}-{endItem}</span> /{" "}
        <span className="font-bold text-admin-ink">{totalItems}</span> {itemLabel}.{" "}
        <span className="font-bold text-admin-ink">{pageSize}</span> mục/trang
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          className="admin-button-secondary !min-w-0 !px-4 !py-2"
          disabled={currentPage === 1}
        >
          Trước
        </button>
        <span className="admin-pill bg-white text-slate-700">
          Trang {currentPage}/{totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          className="admin-button-secondary !min-w-0 !px-4 !py-2"
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
