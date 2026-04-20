import { useEffect } from "react";

export default function VehicleGalleryLightbox({
  gallery,
  title,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onSelect
}) {
  const activeImage = gallery[currentIndex];
  const galleryLabel = title ? `Bộ ảnh ${title}` : "Bộ ảnh xe";
  const imageLabel = activeImage?.altText ?? title ?? `Ảnh xe ${currentIndex + 1}`;

  useEffect(() => {
    if (!gallery.length) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gallery.length, onClose, onNext, onPrev]);

  if (!activeImage) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/78 p-3 backdrop-blur-md sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={galleryLabel}
      onClick={onClose}
    >
      <div
        className="relative mx-auto flex h-full w-full max-w-[96rem] flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(18,27,46,0.92),rgba(7,12,23,0.94))] text-white shadow-[0_38px_120px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(184,138,59,0.18),transparent_58%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(6,10,18,0.38))]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-xl font-bold text-white backdrop-blur transition hover:bg-white/15 sm:right-5 sm:top-5"
          aria-label="Đóng bộ ảnh"
        >
          ×
        </button>

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-brand-amber/90">
              Bộ ảnh đội xe
            </p>
            <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-[15px]">
              Xem ảnh ở kích thước lớn để đối chiếu kiểu xe, không gian và tình trạng thực tế.
            </p>
          </div>
          <p className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-bold text-slate-100 backdrop-blur">
            {currentIndex + 1} / {gallery.length}
          </p>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 px-1 pb-1 sm:px-3 sm:pb-3">
          <div className="grid min-h-0 flex-1 grid-cols-[5.25rem_minmax(0,1fr)] gap-2 rounded-[1.7rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_28%),linear-gradient(180deg,rgba(18,27,46,0.58),rgba(10,16,29,0.76))] p-1 sm:grid-cols-[6.25rem_minmax(0,1fr)] sm:gap-3 sm:p-2">
            <div className="min-h-0 overflow-hidden rounded-[1.2rem] border border-white/10 bg-slate-950/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex max-h-full flex-col gap-2 overflow-y-auto p-2 sm:gap-3 sm:p-2">
                {gallery.map((image, index) => (
                  <button
                    key={image.id ?? `${image.fullUrl}-${index}`}
                    type="button"
                    onClick={() => onSelect(index)}
                    className={`group shrink-0 overflow-hidden rounded-[1rem] border-2 transition ${
                      index === currentIndex
                        ? "border-brand-amber shadow-[0_0_0_1px_rgba(184,138,59,0.28)]"
                        : "border-white/15 opacity-80 hover:border-white/40 hover:opacity-100"
                    }`}
                    aria-label={`Xem ảnh ${index + 1}`}
                  >
                    <div className="vehicle-thumb-stage aspect-[4/5] w-full bg-white/95">
                      <img
                        src={image.fullUrl}
                        alt={image.altText ?? title ?? "Ảnh thu nhỏ"}
                        className="vehicle-thumb-image"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex min-h-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/6 bg-transparent">
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-3 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-3xl text-white backdrop-blur transition hover:bg-white/15 lg:inline-flex"
                aria-label="Ảnh trước"
              >
                ‹
              </button>

              <div className="vehicle-stage vehicle-stage-lightbox h-full w-full px-0">
                <img
                  src={activeImage.fullUrl}
                  alt={imageLabel}
                  className="vehicle-stage-image vehicle-stage-image-lightbox max-h-[calc(100vh-3.5rem)] min-h-0 w-auto max-w-full"
                />
              </div>

              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 z-10 hidden h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/45 text-3xl text-white backdrop-blur transition hover:bg-white/15 lg:inline-flex"
                aria-label="Ảnh tiếp theo"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 px-5 pb-4 sm:px-7 lg:hidden">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
          >
            Ảnh trước
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
          >
            Ảnh tiếp theo
          </button>
        </div>

        <div className="relative z-10 border-t border-white/10 bg-slate-950/18 px-4 py-3 backdrop-blur-sm sm:px-6">
          <p className="truncate text-sm font-semibold text-white">{imageLabel}</p>
        </div>
      </div>
    </div>
  );
}
