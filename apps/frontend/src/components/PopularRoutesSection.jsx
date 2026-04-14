const routes = [
  {
    route: "Thanh Hóa - Nội Bài",
    detail: "Khung đưa đón sân bay đúng giờ, phù hợp cho gia đình và khách công tác cần sự chỉn chu."
  },
  {
    route: "Thanh Hóa - Hà Nội",
    detail: "Lựa chọn quen thuộc cho làm việc, gặp đối tác và các lịch trình riêng cần xe sạch, lịch sự."
  },
  {
    route: "Sầm Sơn - Ninh Bình",
    detail: "Phù hợp cho chuyến đi thư giãn ngắn ngày với nhóm gia đình hoặc khách cần không gian thoải mái."
  },
  {
    route: "Thanh Hóa - Cửa Lò",
    detail: "Tuyến di chuyển cho chuyến biển, đoàn doanh nghiệp và hành trình cần điều phối gọn gàng."
  }
];

export default function PopularRoutesSection() {
  return (
    <section className="site-shell mx-auto px-4 py-16 sm:px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-brand-amber">
              Tuyến phổ biến
            </p>
            <h3 className="display-serif mt-3 text-4xl text-brand-navy">
              Những hành trình được lựa chọn nhiều cho lịch trình riêng
            </h3>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Một vài tuyến tiêu biểu để khách hình dung nhanh phạm vi phục vụ và lựa chọn loại chuyến
            đi phù hợp với nhu cầu thực tế.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {routes.map((item) => (
            <article
              key={item.route}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5"
            >
              <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-brand-amber">
                Tuyến xe
              </p>
              <h4 className="mt-3 text-lg font-extrabold text-brand-navy">{item.route}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
