export default function VehiclesTab({
  editingVehicleId,
  selectedVehicleId,
  vehicleFilterCategoryId,
  vehicleSearch,
  vehicleForm,
  vehicleCategories,
  savingVehicle,
  vehicles,
  uploadingVehicleId,
  handleVehicleFormChange,
  handleCreateVehicle,
  resetVehicleForm,
  handleEditVehicle,
  handleDuplicateVehicle,
  handleDeleteVehicle,
  handleDeleteVehicleImage,
  handleSetPrimaryImage,
  handleImageAltTextBlur,
  handleImageSortOrderChange,
  handleVehicleImageUpload,
  handleVehicleFilterChange,
  handleVehicleSearchChange,
  handleSelectVehicle,
  resolveAdminAssetUrl
}) {
  const filteredVehicles =
    vehicleFilterCategoryId === "all"
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.categoryId === vehicleFilterCategoryId);

  const searchedVehicles = filteredVehicles.filter((vehicle) =>
    vehicle.name.toLowerCase().includes(vehicleSearch.toLowerCase().trim())
  );

  const selectedVehicle =
    searchedVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleCreateVehicle} className="admin-card rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
                {editingVehicleId ? "Sửa xe" : "Tạo xe"}
              </h3>
              <p className="mt-2 text-sm text-admin-steel">
                Chỉ cần nhập nhóm xe, tên, số chỗ, mô tả và tiện ích. Hệ thống tự sinh mã kỹ thuật.
              </p>
            </div>
            {editingVehicleId ? (
              <button type="button" onClick={resetVehicleForm} className="admin-button-ghost">
                Hủy sửa
              </button>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Nhóm xe</span>
              <select
                className="admin-select"
                name="categoryId"
                value={vehicleForm.categoryId}
                onChange={handleVehicleFormChange}
              >
                {vehicleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-[1fr_180px]">
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Tên xe</span>
                <input
                  className="admin-field"
                  name="name"
                  placeholder="Ví dụ: Hyundai Solati"
                  value={vehicleForm.name}
                  onChange={handleVehicleFormChange}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Số chỗ</span>
                <input
                  className="admin-field"
                  name="seatCount"
                  type="number"
                  placeholder="16"
                  value={vehicleForm.seatCount}
                  onChange={handleVehicleFormChange}
                />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Mô tả ngắn</span>
              <input
                className="admin-field"
                name="shortDescription"
                placeholder="Dòng mô tả ngắn hiển thị nhanh"
                value={vehicleForm.shortDescription}
                onChange={handleVehicleFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Mô tả chi tiết</span>
              <textarea
                className="admin-field admin-textarea"
                name="description"
                placeholder="Mô tả chi tiết về xe"
                value={vehicleForm.description}
                onChange={handleVehicleFormChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Tiện ích</span>
              <input
                className="admin-field"
                name="features"
                placeholder="Máy lạnh, Ghế ngả, Cổng sạc..."
                value={vehicleForm.features}
                onChange={handleVehicleFormChange}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-admin-steel">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={vehicleForm.isFeatured}
                  onChange={handleVehicleFormChange}
                />
                Xe nổi bật
              </label>
              <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-admin-steel">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={vehicleForm.isPublished}
                  onChange={handleVehicleFormChange}
                />
                Hiển thị ngoài website
              </label>
            </div>
            <button className="admin-button-primary justify-center" disabled={savingVehicle}>
              {savingVehicle
                ? "Đang lưu..."
                : editingVehicleId
                  ? "Cập nhật xe"
                  : "Tạo xe"}
            </button>
          </div>
        </form>

        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Danh sách xe</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Lọc theo nhóm, tìm theo tên và bấm vào một xe để quản lý ảnh riêng.
              </p>
            </div>
            <span className="admin-pill bg-slate-100 text-slate-700">
              {searchedVehicles.length} xe
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <input
              className="admin-field max-w-72"
              placeholder="Tìm theo tên xe"
              value={vehicleSearch}
              onChange={(event) => handleVehicleSearchChange(event.target.value)}
            />
            <select
              className="admin-select max-w-64"
              value={vehicleFilterCategoryId}
              onChange={(event) => handleVehicleFilterChange(event.target.value)}
            >
              <option value="all">Tất cả nhóm xe</option>
              {vehicleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {searchedVehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => handleSelectVehicle(vehicle.id)}
                className={`block w-full rounded-[1.5rem] border p-5 text-left transition ${
                  selectedVehicleId === vehicle.id
                    ? "border-admin-accent bg-emerald-50/70 shadow-sm"
                    : "border-slate-200 bg-slate-50/70 hover:border-admin-accent"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold text-admin-ink">{vehicle.name}</p>
                    <p className="mt-1 text-sm text-admin-steel">
                      {vehicle.category?.name} - {vehicle.seatCount} chỗ
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-admin-steel">
                      {vehicle.shortDescription || "Chưa có mô tả ngắn"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="admin-pill bg-slate-100 text-slate-700">
                      {vehicle.images?.length ?? 0} ảnh
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditVehicle(vehicle);
                      }}
                      className="admin-button-secondary"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDuplicateVehicle(vehicle);
                      }}
                      className="admin-button-primary"
                    >
                      Nhân bản
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteVehicle(vehicle.id);
                      }}
                      className="admin-button-danger"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </button>
            ))}
            {!searchedVehicles.length ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-admin-steel">
                Không tìm thấy xe phù hợp với bộ lọc hiện tại.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="admin-card rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Quản lý ảnh xe</h3>
            <p className="mt-2 text-sm text-admin-steel">
              Chọn một xe ở danh sách phía trên để thêm ảnh, đặt ảnh đại diện và sắp xếp thứ tự.
            </p>
          </div>
        </div>

        {!selectedVehicle ? (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 px-5 py-12 text-center text-sm text-admin-steel">
            Chưa chọn xe nào để quản lý ảnh.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-lg font-extrabold text-admin-ink">{selectedVehicle.name}</p>
                <p className="mt-1 text-sm text-admin-steel">
                  {selectedVehicle.category?.name} - {selectedVehicle.seatCount} chỗ
                </p>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-admin-steel">
                    {uploadingVehicleId === selectedVehicle.id
                      ? "Đang upload..."
                      : "Thêm ảnh cho xe này"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) =>
                      handleVehicleImageUpload(selectedVehicle.id, Array.from(event.target.files ?? []))
                    }
                  />
                </label>
              </div>
              {(selectedVehicle.images ?? [])[0] ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <img
                    src={resolveAdminAssetUrl((selectedVehicle.images ?? [])[0].imageUrl)}
                    alt={selectedVehicle.name}
                    className="h-64 w-full rounded-[1rem] object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {(selectedVehicle.images ?? []).map((image) => (
                <div
                  key={image.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <img
                    src={resolveAdminAssetUrl(image.imageUrl)}
                    alt={image.altText ?? selectedVehicle.name}
                    className="h-36 w-full rounded-[1.2rem] object-cover"
                  />
                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(image.id)}
                      className={image.isPrimary ? "admin-button-secondary w-full" : "admin-button-ghost w-full"}
                    >
                      {image.isPrimary ? "Ảnh đại diện" : "Đặt đại diện"}
                    </button>
                    <input
                      className="admin-field !rounded-2xl !px-3 !py-3 text-sm"
                      defaultValue={image.altText ?? ""}
                      placeholder="Mô tả ảnh"
                      onBlur={(event) => handleImageAltTextBlur(image.id, event.target.value)}
                    />
                    <input
                      className="admin-field !rounded-2xl !px-3 !py-3 text-sm"
                      type="number"
                      defaultValue={image.sortOrder}
                      placeholder="Thứ tự"
                      onBlur={(event) => handleImageSortOrderChange(image.id, event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicleImage(image.id)}
                      className="admin-button-danger w-full"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
