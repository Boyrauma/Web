export default function ServicesTab({
  editingServiceId,
  serviceForm,
  savingService,
  services,
  handleServiceFormChange,
  handleCreateService,
  handleEditService,
  handleDeleteService,
  resetServiceForm
}) {
  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
      <form onSubmit={handleCreateService} className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingServiceId ? "Sửa dịch vụ" : "Tạo dịch vụ"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Các mục hiển thị ngoài website như thuê xe du lịch, cưới hỏi, sân bay.
            </p>
          </div>
          {editingServiceId ? (
            <button type="button" onClick={resetServiceForm} className="admin-button-ghost">
              Hủy sửa
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Tiêu đề</span>
            <input
              className="admin-field"
              name="title"
              placeholder="Ví dụ: Đưa đón sân bay"
              value={serviceForm.title}
              onChange={handleServiceFormChange}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-bold text-admin-ink">Mô tả</span>
            <textarea
              className="admin-field admin-textarea"
              name="description"
              placeholder="Giới thiệu ngắn về dịch vụ"
              value={serviceForm.description}
              onChange={handleServiceFormChange}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Icon</span>
              <input
                className="admin-field"
                name="icon"
                placeholder="Ví dụ: car-front"
                value={serviceForm.icon}
                onChange={handleServiceFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Thứ tự hiển thị</span>
              <input
                className="admin-field"
                name="sortOrder"
                type="number"
                placeholder="0"
                value={serviceForm.sortOrder}
                onChange={handleServiceFormChange}
              />
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-admin-steel">
            <input
              type="checkbox"
              name="isPublished"
              checked={serviceForm.isPublished}
              onChange={handleServiceFormChange}
            />
            Hiển thị ngoài website
          </label>
          <button className="admin-button-primary justify-center" disabled={savingService}>
            {savingService
              ? "Đang lưu..."
              : editingServiceId
                ? "Cập nhật dịch vụ"
                : "Tạo dịch vụ"}
          </button>
        </div>
      </form>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Danh sách dịch vụ</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Thông tin được dùng trực tiếp ở trang public.
            </p>
          </div>
          <span className="admin-pill bg-slate-100 text-slate-700">{services.length} mục</span>
        </div>

        <div className="mt-6 space-y-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-[1.5rem] border border-slate-200/90 bg-slate-50/80 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-extrabold text-admin-ink">{service.title}</p>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-admin-steel">
                    {service.description || "Chưa có mô tả"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditService(service)}
                    className="admin-button-secondary"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(service.id)}
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
