export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatExportDateTime(value) {
  if (!value) return "Chưa có thời gian";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thời gian";

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatExportCurrency(value) {
  if (value === null || value === undefined || value === "") return "0 đ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function downloadExcelHtml(filename, title, tableHtml) {
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; background: #ffffff; color: #14233c; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; }
          th { background: #1f3352; color: #ffffff; border: 1px solid #b8c4d6; padding: 10px 8px; font-size: 11px; font-weight: 700; text-align: center; vertical-align: middle; }
          td { border: 1px solid #cfd7e3; padding: 10px 8px; font-size: 11px; text-align: center; vertical-align: middle; word-wrap: break-word; white-space: normal; }
          tr:nth-child(even) td { background: #f7f9fc; }
          .report-title { background: #eef3f9; color: #14233c; font-size: 20px; font-weight: 700; }
          .report-subtitle { background: #f8fafc; color: #5b6880; font-size: 11px; }
          .text-cell { mso-number-format: "\\@"; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr><th class="report-title" colspan="12">${escapeHtml(title)}</th></tr>
            <tr><th class="report-subtitle" colspan="12">Ngày xuất: ${escapeHtml(formatExportDateTime(new Date()))}</th></tr>
          </thead>
        </table>
        ${tableHtml}
      </body>
    </html>
  `;

  const blob = new Blob([`\ufeff${html}`], {
    type: "application/vnd.ms-excel;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function openPrintDocument(title, bodyHtml) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    window.alert("Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; background: #eef2f6; color: #122033; font-family: Arial, sans-serif; }
          .page { width: min(960px, calc(100% - 32px)); margin: 24px auto; border: 1px solid #d8e0ec; border-radius: 18px; background: #ffffff; padding: 28px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12); }
          .brand { color: #b88938; font-size: 12px; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; }
          h1 { margin: 10px 0 8px; font-size: 30px; color: #14233c; }
          h2 { margin: 24px 0 12px; font-size: 18px; color: #14233c; }
          p { margin: 0; line-height: 1.65; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #d8e0ec; padding: 10px 12px; text-align: left; vertical-align: top; font-size: 13px; }
          th { background: #f3f6fa; color: #5b6880; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
          .box { border: 1px solid #d8e0ec; border-radius: 14px; background: #f8fafc; padding: 14px; }
          .label { color: #64748b; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
          .value { margin-top: 6px; color: #14233c; font-size: 15px; font-weight: 700; }
          .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 10px; padding: 12px; background: rgba(238, 242, 246, 0.92); backdrop-filter: blur(8px); }
          .button { border: 0; border-radius: 12px; background: #0f766e; color: #ffffff; cursor: pointer; font-weight: 800; padding: 10px 16px; }
          @media print {
            body { background: #ffffff; }
            .toolbar { display: none; }
            .page { width: 100%; margin: 0; border: 0; border-radius: 0; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button class="button" onclick="window.print()">In / Lưu PDF</button>
        </div>
        <main class="page">${bodyHtml}</main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}
