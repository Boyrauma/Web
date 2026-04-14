export default function StickyContactBar({ hotline }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-full border border-[#d9c39f] bg-[#f8f2e8]/95 p-2 shadow-premium backdrop-blur md:bottom-6 lg:hidden">
      <div className="flex gap-2">
        <a
          href={`tel:${hotline ?? "0979860498"}`}
          className="flex-1 rounded-full bg-[#14233c] px-4 py-3 text-center text-sm font-bold text-white"
        >
          Gọi ngay
        </a>
        <a
          href="#booking"
          className="flex-1 rounded-full bg-[#b88a3b] px-4 py-3 text-center text-sm font-bold text-white"
        >
          Liên hệ
        </a>
      </div>
    </div>
  );
}
