function dedupeImages(images) {
  return images.filter(
    (image, index, array) =>
      image.fullUrl && array.findIndex((item) => item.fullUrl === image.fullUrl) === index
  );
}

export default function FleetSection({ vehicleCategories, resolveAssetUrl, onOpenGallery }) {
  const fallbackGroups = [
    {
      title: "Xe 7 chỗ",
      description: "Innova, Fortuner sạch sẽ, phù hợp gia đình và công tác.",
      images: [{ id: "fallback-7", fullUrl: "/assets/xe7cho.jpg", altText: "Xe 7 chỗ" }]
    },
    {
      title: "Xe 16 chỗ",
      description: "Transit, Solati trần cao, thoải mái cho hành trình dài.",
      images: [{ id: "fallback-16", fullUrl: "/assets/xe16cho.jpg", altText: "Xe 16 chỗ" }]
    },
    {
      title: "Xe 29 - 35 chỗ",
      description: "County, Samco, Thaco đời mới, êm ái và rộng rãi.",
      images: [
        {
          id: "fallback-35",
          fullUrl: "/assets/xecountybonghoi.jpg",
          altText: "Xe 29 - 35 chỗ"
        }
      ]
    }
  ];

  const groups = vehicleCategories.length
    ? vehicleCategories.map((category) => {
        const images = dedupeImages(
          (category.vehicles ?? []).flatMap((vehicle) =>
            (vehicle.images ?? []).map((image) => ({
              id: image.id,
              fullUrl: resolveAssetUrl(image.imageUrl),
              altText: image.altText ?? vehicle.name
            }))
          )
        );

        return {
          title: category.name,
          description: category.description ?? "",
          images: images.length
            ? images
            : [
                {
                  id: `${category.id}-fallback`,
                  fullUrl: "/assets/xecountybonghoi.jpg",
                  altText: category.name
                }
              ]
        };
      })
    : fallbackGroups;

  return (
    <section id="doi-xe" className="section-shell bg-white/75 py-16">
      <div className="site-shell mx-auto px-4 sm:px-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">Đội xe</p>
          <h3 className="mt-2 text-3xl font-black uppercase text-brand-navy">
            Hệ thống xe đời mới
          </h3>
        </div>

        <div className="mt-10 grid gap-8 md:auto-rows-fr md:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.title}
              className="reveal-card hover-lift flex min-h-[472px] h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-premium"
            >
              <button
                type="button"
                onClick={() => onOpenGallery?.(group.title, group.images, 0)}
                className="group relative block h-[264px] w-full shrink-0 overflow-hidden bg-slate-100 text-left"
                aria-label={`Mở bộ ảnh ${group.title}`}
              >
                <div className="vehicle-stage vehicle-stage-card h-full w-full">
                  <img
                    src={group.images[0]?.fullUrl ?? "/assets/xecountybonghoi.jpg"}
                    alt={group.images[0]?.altText ?? group.title}
                    loading="lazy"
                    decoding="async"
                    className="vehicle-stage-image vehicle-stage-image-card transition duration-300"
                  />
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent px-5 pb-4 pt-12">
                  <div className="flex items-end justify-between gap-3">
                    <div className="flex -space-x-3">
                      {group.images.slice(0, 3).map((image, index) => (
                        <div
                          key={image.id ?? `${group.title}-${index}`}
                          className="vehicle-thumb-stage h-12 w-12 rounded-2xl border-2 border-white/90 shadow-lg"
                        >
                          <img
                            src={image.fullUrl}
                            alt={image.altText ?? group.title}
                            loading="lazy"
                            decoding="async"
                            className="vehicle-thumb-image"
                          />
                        </div>
                      ))}
                    </div>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-navy">
                      {group.images.length} ảnh
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex flex-1 flex-col space-y-4 p-6">
                <h4 className="text-2xl font-extrabold text-brand-navy">{group.title}</h4>
                <p className="min-h-[88px] text-slate-600">{group.description}</p>

                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenGallery?.(group.title, group.images, 0)}
                    className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-brand-amber hover:text-brand-amber"
                  >
                    Xem bộ ảnh
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

