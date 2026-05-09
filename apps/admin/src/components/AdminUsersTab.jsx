import { useMemo, useState } from "react";
import {
  PERMISSION_GROUPS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  ROLE_OPTIONS
} from "../utils/adminPermissions";

function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role;
}

function getRoleClass(role) {
  if (role === "super_admin") return "bg-rose-50 text-rose-700";
  if (role === "operator") return "bg-sky-50 text-sky-700";
  if (role === "accountant") return "bg-emerald-50 text-emerald-700";
  if (role === "content_editor") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export default function AdminUsersTab({
  adminUsers,
  adminUserForm,
  editingAdminUserId,
  savingAdminUser,
  currentAdmin,
  handleAdminUserFormChange,
  handleAdminUserRoleChange,
  handleAdminUserPermissionToggle,
  handleApplyAdminUserPermissionPreset,
  handleCreateAdminUser,
  handleEditAdminUser,
  handleDeleteAdminUser,
  handleToggleAdminUserActive,
  handleResetAdminUserPassword,
  resetAdminUserForm
}) {
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredAdminUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return adminUsers.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [user.fullName, user.email, getRoleLabel(user.role)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [adminUsers, roleFilter, searchValue]);

  const activeCount = useMemo(
    () => adminUsers.filter((user) => user.isActive).length,
    [adminUsers]
  );
  const operatorCount = useMemo(
    () => adminUsers.filter((user) => user.role === "operator" && user.isActive).length,
    [adminUsers]
  );
  const contentEditorCount = useMemo(
    () => adminUsers.filter((user) => user.role === "content_editor" && user.isActive).length,
    [adminUsers]
  );

  return (
    <section className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Tổng tài khoản
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{adminUsers.length}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Đang hoạt động
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{activeCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Điều hành
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{operatorCount}</p>
        </div>
        <div className="admin-card rounded-[1.25rem] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-admin-steel">
            Biên tập nội dung
          </p>
          <p className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">{contentEditorCount}</p>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <div className="admin-card rounded-[1.25rem] p-6">
          <div>
            <h3 className="admin-title text-2xl font-extrabold text-admin-ink">
              {editingAdminUserId ? "Cập nhật tài khoản admin" : "Tạo tài khoản admin"}
            </h3>
            <p className="mt-2 text-sm text-admin-steel">
              Super admin có thể gán vai trò và bật/tắt quyền chi tiết theo từng chức năng.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateAdminUser}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Họ tên</span>
              <input
                className="admin-field"
                name="fullName"
                value={adminUserForm.fullName}
                onChange={handleAdminUserFormChange}
                placeholder="Ví dụ: Điều hành ca sáng"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Email đăng nhập</span>
              <input
                type="email"
                className="admin-field"
                name="email"
                value={adminUserForm.email}
                onChange={handleAdminUserFormChange}
                placeholder="admin@nhaxedinhdung.vn"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Vai trò</span>
              <select
                className="admin-select"
                name="role"
                value={adminUserForm.role}
                onChange={(event) => handleAdminUserRoleChange(event.target.value)}
              >
                {ROLE_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">
                {editingAdminUserId ? "Mật khẩu mới (để trống nếu giữ nguyên)" : "Mật khẩu"}
              </span>
              <input
                type="password"
                className="admin-field"
                name="password"
                value={adminUserForm.password}
                onChange={handleAdminUserFormChange}
                placeholder={editingAdminUserId ? "Nhập để đổi mật khẩu" : "Tối thiểu 8 ký tự"}
                required={!editingAdminUserId}
              />
            </label>

            <label className="flex items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                name="isActive"
                checked={adminUserForm.isActive}
                onChange={handleAdminUserFormChange}
              />
              <span className="text-sm font-semibold text-admin-ink">Cho phép đăng nhập</span>
            </label>

            <div className="space-y-3 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-admin-ink">Quyền chi tiết</p>
                  <p className="mt-1 text-xs font-medium text-admin-steel">
                    Chọn đúng các chức năng tài khoản này được phép truy cập.
                  </p>
                </div>
                <span className="admin-pill bg-slate-100 text-slate-700">
                  {adminUserForm.permissions.length} quyền
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="admin-button-ghost px-3 py-2 text-xs"
                    onClick={() => handleApplyAdminUserPermissionPreset(option.value)}
                  >
                    {option.label}: {ROLE_DEFAULT_PERMISSIONS[option.value]?.length ?? 0}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-admin-steel">
                      {group.label}
                    </p>
                    <div className="grid gap-2">
                      {group.items.map((permission) => (
                        <label
                          key={permission.value}
                          className="flex items-center gap-3 rounded-[0.9rem] border border-slate-200 bg-white px-3 py-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={adminUserForm.permissions.includes(permission.value)}
                            onChange={() => handleAdminUserPermissionToggle(permission.value)}
                          />
                          <span className="text-sm font-semibold text-admin-ink">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" className="admin-button-primary" disabled={savingAdminUser}>
                {savingAdminUser
                  ? "Đang lưu..."
                  : editingAdminUserId
                    ? "Lưu thay đổi"
                    : "Tạo tài khoản"}
              </button>
              <button
                type="button"
                className="admin-button-ghost"
                onClick={resetAdminUserForm}
                disabled={savingAdminUser}
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        <div className="admin-card rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="admin-title text-2xl font-extrabold text-admin-ink">Tài khoản hiện có</h3>
              <p className="mt-2 text-sm text-admin-steel">
                Theo dõi vai trò, trạng thái và các thao tác nhanh cho từng tài khoản quản trị.
              </p>
            </div>
            <span className="admin-pill bg-slate-100 text-slate-700">
              {filteredAdminUsers.length}/{adminUsers.length} tài khoản
            </span>
          </div>

          <div className="mt-6 rounded-[1rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Tìm tài khoản</span>
                <input
                  className="admin-field"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Họ tên, email, vai trò..."
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-bold text-admin-ink">Lọc vai trò</span>
                <select
                  className="admin-select"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {filteredAdminUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-[1.15rem] border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-extrabold text-admin-ink">{user.fullName}</p>
                      {currentAdmin?.id === user.id ? (
                        <span className="admin-pill bg-indigo-50 text-indigo-700">Bạn</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-admin-steel">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`admin-pill ${getRoleClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                    <span
                      className={`admin-pill ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}
                    >
                      {user.isActive ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-admin-steel">
                  {user.permissions?.length ?? 0} quyền đang bật
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="admin-button-secondary"
                    onClick={() => handleEditAdminUser(user)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="admin-button-ghost"
                    onClick={() => handleResetAdminUserPassword(user)}
                  >
                    Đặt lại mật khẩu
                  </button>
                  <button
                    type="button"
                    className="admin-button-ghost"
                    onClick={() => handleToggleAdminUserActive(user)}
                  >
                    {user.isActive ? "Khóa tài khoản" : "Mở khóa"}
                  </button>
                  <button
                    type="button"
                    className="admin-button-ghost"
                    onClick={() => handleDeleteAdminUser(user.id)}
                    disabled={currentAdmin?.id === user.id}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}

            {!filteredAdminUsers.length ? (
              <div className="rounded-[1.15rem] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-semibold text-admin-steel">
                Không có tài khoản admin nào khớp với bộ lọc hiện tại.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
