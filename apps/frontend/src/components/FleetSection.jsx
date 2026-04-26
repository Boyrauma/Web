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
      description: "Gọn cho gia đình nhỏ, chuyến sân bay và lịch công tác cần đi đúng giờ.",
      images: [{ id: "fallback-7", fullUrl: "/assets/xe7cho.jpg", altText: "Xe 7 chỗ" }]
    },
    {
      title: "Xe 16 chỗ",
      description: "Phù hợp đoàn vừa, đi tỉnh, đi lễ và hành trình dài cần không gian thoáng.",
      images: [{ id: "fallback-16", fullUrl: "/assets/xe16cho.jpg", altText: "Xe 16 chỗ" }]
    },
    {
      title: "Xe 29 - 35 chỗ",
      description: "Dành cho đoàn đông, tour riêng, cưới hỏi hoặc công tác nhiều điểm dừng.",
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
    <section
      id="doi-xe"
      className="section-shell bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(246,239,227,0.58))] py-16"
    >
      <div className="site-shell mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">Đội xe</p>
          <h3 className="mt-2 text-3xl font-black uppercase text-brand-navy">
            Chọn đúng nhóm xe cho đúng kiểu chuyến đi
          </h3>
        </div>

        <div className="mt-10 grid gap-8 md:auto-rows-fr md:grid-cols-3">
          {groups.map((group) => (
            <article
              key={group.title}
              className="reveal-card hover-lift flex h-full min-h-[472px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:shadow-premium"
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
                  <div className="flex items-end justify-end gap-3">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-navy">
                      {group.images.length} ảnh
                    </span>
                  </div>
                </div>
              </button>

              <div className="flex flex-1 flex-col space-y-4 p-6">
                <h4 className="text-2xl font-extrabold text-brand-navy">{group.title}</h4>
                <p className="min-h-[88px] text-slate-600">
                  {group.description || "Nhóm xe đang được dùng cho các chuyến thực tế của nhà xe."}
                </p>

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
