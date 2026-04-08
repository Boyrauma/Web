export default function VehicleCategoriesTab({
  editingCategoryId,
  categoryForm,
  savingCategory,
  vehicleCategories,
  handleQuickCreateVehicle,
  handleCategoryFormChange,
  handleCreateCategory,
  handleEditCategory,
  handleDeleteCategory,
  resetCategoryForm
}) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={handleCreateCategory} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingCategoryId ? "Sửa nhóm xe" : "Tạo nhóm xe"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Phân loại đội xe theo 4 chỗ, 7 chỗ, 16 chỗ, 45 chỗ để người mới vận hành dễ quản lý.
            </p>
          </div>
          {editingCategoryId ? (
            <button type="button" onClick={resetCategoryForm} className="admin-button-ghost">
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tên nhóm xe</span>
            <input
              className="admin-field"
              name="name"
              placeholder="Ví dụ: Xe 16 chỗ"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Mô tả</span>
            <textarea
              className="admin-field admin-textarea"
              name="description"
              placeholder="Mô tả ngắn để hiển thị và dễ nhận biết"
              value={categoryForm.description}
              onChange={handleCategoryFormChange}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Thứ tự hiển thị</span>
            <input
              className="admin-field"
              name="sortOrder"
              type="number"
              placeholder="0"
              value={categoryForm.sortOrder}
              onChange={handleCategoryFormChange}
            />
          </label>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-admin-steel">
            <input
              type="checkbox"
              name="isPublished"
              checked={categoryForm.isPublished}
              onChange={handleCategoryFormChange}
            />
            Hiển thị ngoài website
          </label>
          <button className="admin-button-primary justify-center" disabled={savingCategory}>
            {savingCategory
              ? "Đang lưu..."
              : editingCategoryId
                ? "Cập nhật nhóm xe"
                : "Tạo nhóm xe"}
          </button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              Danh sách nhóm xe
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Bấm tạo xe ngay từ một nhóm để rút ngắn thao tác.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">
            {vehicleCategories.length} nhóm
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {vehicleCategories.map((category) => (
            <div
              key={category.id}
              className="rounded-[1.5rem] border border-slate-200/90 bg-slate-50/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-admin-ink">{category.name}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-admin-steel">
                    {category.description || "Chưa có mô tả cho nhóm xe này."}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    {category.vehicles?.length ?? 0} xe trong nhóm
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCreateVehicle(category)}
                    className="admin-button-primary"
                  >
                    Tạo xe
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="admin-button-secondary"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="admin-button-danger"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
