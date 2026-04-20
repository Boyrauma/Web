import { Link } from "react-router-dom";

export default function VehicleShowcaseSection({
  flattenedVehicles,
  selectedVehicleSlug,
  setSelectedVehicleSlug,
  selectedVehicle,
  selectedVehicleGallery,
  selectedImageUrl,
  setSelectedImageUrl
}) {
  const currentSelectedImage =
    selectedVehicleGallery.find((image) => image.imageUrl === selectedImageUrl)?.fullUrl ??
    selectedVehicleGallery[0]?.fullUrl ??
    "/assets/xecountybonghoi.jpg";

  return (
    <section id="showcase-xe" className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-4">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
            Chi tiết xe
          </p>
          <h3 className="text-3xl font-black uppercase text-brand-navy">
            Chọn xe phù hợp cho hành trình của bạn
          </h3>
          <div className="space-y-3">
            {flattenedVehicles.length ? (
              flattenedVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicleSlug(vehicle.slug)}
                  className={`block w-full rounded-[1.5rem] border px-5 py-4 text-left transition ${
                    selectedVehicleSlug === vehicle.slug
                      ? "border-brand-amber bg-brand-navy text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-brand-amber"
                  }`}
                >
                  <p className="font-bold">{vehicle.name}</p>
                  <p
                    className={`mt-1 text-sm ${
                      selectedVehicleSlug === vehicle.slug ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {vehicle.categoryName} · {vehicle.seatCount} chỗ
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-500">
                Chưa có dữ liệu xe từ hệ thống.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="vehicle-stage vehicle-stage-showcase h-[400px] w-full rounded-[1.5rem]">
            <img
              src={currentSelectedImage}
              alt={selectedVehicle?.name ?? "Xe dịch vụ"}
              loading="lazy"
              decoding="async"
              className="vehicle-stage-image vehicle-stage-image-showcase"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {selectedVehicleGallery.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageUrl(image.imageUrl)}
                className={`overflow-hidden rounded-2xl border-2 ${
                  selectedImageUrl === image.imageUrl ? "border-brand-amber" : "border-transparent"
                }`}
              >
                <div className="vehicle-thumb-stage h-20 w-24">
                  <img
                    src={image.fullUrl}
                    alt={image.altText ?? selectedVehicle?.name ?? "Xe dịch vụ"}
                    loading="lazy"
                    decoding="async"
                    className="vehicle-thumb-image"
                  />
                </div>
              </button>
            ))}
          </div>

          {selectedVehicle ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand-amber">
                    {selectedVehicle.categoryName}
                  </p>
                  <h4 className="mt-2 text-3xl font-black text-brand-navy">
                    {selectedVehicle.name}
                  </h4>
                </div>
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-brand-navy">
                  {selectedVehicle.seatCount} chỗ
                </div>
              </div>

              <p className="text-slate-600">
                {selectedVehicle.description || selectedVehicle.shortDescription}
              </p>
              <Link
                to={`/xe/${selectedVehicle.slug}`}
                className="inline-flex rounded-full bg-brand-navy px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-brand-amber"
              >
                Mở trang chi tiết
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
