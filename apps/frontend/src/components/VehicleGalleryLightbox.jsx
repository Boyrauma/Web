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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Bộ ảnh ${title}` : "Bộ ảnh xe"}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl rounded-[2rem] bg-slate-950/90 p-4 text-white shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl font-bold text-white transition hover:bg-white/20"
          aria-label="Đóng bộ ảnh"
        >
          ×
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 pr-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-amber">
              Bộ ảnh đội xe
            </p>
            <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h3>
          </div>
          <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
            {currentIndex + 1} / {gallery.length}
          </p>
        </div>

        <div className="mt-6 grid items-center gap-4 lg:grid-cols-[72px_minmax(0,1fr)_72px]">
          <button
            type="button"
            onClick={onPrev}
            className="hidden h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition hover:bg-white/20 lg:inline-flex"
            aria-label="Ảnh trước"
          >
            ‹
          </button>

          <div className="vehicle-stage vehicle-stage-lightbox overflow-hidden rounded-[1.75rem]">
            <img
              src={activeImage.fullUrl}
              alt={activeImage.altText ?? title ?? "Ảnh xe"}
              className="vehicle-stage-image h-[56vh] sm:h-[68vh]"
            />
          </div>

          <button
            type="button"
            onClick={onNext}
            className="hidden h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-2xl text-white transition hover:bg-white/20 lg:inline-flex"
            aria-label="Ảnh tiếp theo"
          >
            ›
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Ảnh trước
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
          >
            Ảnh tiếp theo
          </button>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {gallery.map((image, index) => (
            <button
              key={image.id ?? `${image.fullUrl}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                index === currentIndex ? "border-brand-amber" : "border-white/10 opacity-70 hover:opacity-100"
              }`}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <div className="vehicle-thumb-stage h-20 w-24 sm:h-24 sm:w-28">
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
    </div>
  );
}
