import { Link } from "react-router-dom";

export default function StickyContactBar({ hotline, groupLink }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-full border border-[#d9c39f] bg-[#f8f2e8]/95 p-2 shadow-premium backdrop-blur md:bottom-6 lg:hidden">
      <div className="flex gap-2">
        <a
          href={`tel:${hotline ?? "0979860498"}`}
          className="flex-1 rounded-full bg-[#14233c] px-4 py-3 text-center text-sm font-bold text-white"
        >
          Gọi
        </a>
        {groupLink ? (
          <a
            href={groupLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full bg-[#9a5c00] px-4 py-3 text-center text-sm font-bold text-white"
          >
            Nhóm
          </a>
        ) : null}
        <Link
          to="/#booking"
          className="flex-1 rounded-full border border-[#d9c39f] bg-white px-4 py-3 text-center text-sm font-bold text-[#14233c]"
        >
          Đặt lịch
        </Link>
      </div>
    </div>
  );
}
