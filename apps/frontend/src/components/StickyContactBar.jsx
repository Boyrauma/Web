export default function StickyContactBar({ hotline }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-premium backdrop-blur md:bottom-6 lg:hidden">
      <div className="flex gap-2">
        <a
          href={`tel:${hotline ?? "0979860498"}`}
          className="flex-1 rounded-full bg-brand-navy px-4 py-3 text-center text-sm font-bold text-white"
        >
          Gọi ngay
        </a>
        <a
          href="#booking"
          className="flex-1 rounded-full bg-brand-amber px-4 py-3 text-center text-sm font-bold text-white"
        >
          Nhận báo giá
        </a>
      </div>
    </div>
  );
}
