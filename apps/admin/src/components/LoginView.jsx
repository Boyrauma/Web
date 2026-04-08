export default function LoginView({
  siteName,
  siteTagline,
  logoUrl,
  loginForm,
  authState,
  handleLoginChange,
  handleLoginSubmit
}) {
  const displayName = siteName ?? "Nhà xe";

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="admin-card-dark hidden rounded-[1.5rem] p-8 text-white lg:block">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-emerald-300">
            Premium Admin
          </p>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="mt-6 h-16 w-auto max-w-[180px] rounded-2xl bg-white/95 p-3 object-contain"
            />
          ) : null}
          <h1 className="admin-title mt-4 text-4xl font-extrabold leading-tight">
            Quản trị vận hành đẹp, rõ và dễ dùng cho {displayName}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Gọn, rõ, đủ để vận hành hằng ngày.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                Booking
              </p>
              <p className="mt-2 text-2xl font-extrabold">Ưu tiên mới</p>
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">Xe</p>
              <p className="mt-2 text-2xl font-extrabold">CRUD rõ ràng</p>
            </div>
            <div className="rounded-[1rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                Nội dung
              </p>
              <p className="mt-2 text-2xl font-extrabold">Dễ chỉnh sửa</p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleLoginSubmit}
          autoComplete="off"
          className="admin-panel w-full rounded-[1.5rem] p-8 sm:p-9"
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-admin-accent">
            Đăng nhập quản trị
          </p>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="mt-5 h-14 w-auto max-w-[180px] rounded-2xl bg-slate-100 p-3 object-contain"
            />
          ) : null}
          <h2 className="admin-title mt-4 text-4xl font-extrabold text-admin-ink">
            {displayName} Admin
          </h2>
          {siteTagline ? <p className="mt-3 text-base text-admin-steel">{siteTagline}</p> : null}

          <div className="mt-8 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Email quản trị</span>
              <input
                className="admin-field"
                name="email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="off"
                value={loginForm.email}
                onChange={handleLoginChange}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-admin-ink">Mật khẩu</span>
              <input
                className="admin-field"
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                autoComplete="new-password"
                value={loginForm.password}
                onChange={handleLoginChange}
              />
            </label>

            <button
              type="submit"
              disabled={authState.loading}
              className="admin-button-primary mt-2 w-full"
            >
              {authState.loading ? "Đang đăng nhập..." : "Vào khu quản trị"}
            </button>

            {authState.error ? (
              <p className="rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {authState.error}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
