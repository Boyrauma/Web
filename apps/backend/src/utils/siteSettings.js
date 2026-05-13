export const DEFAULT_SITE_SETTINGS = [
  { key: "address", value: "555 Quang Trung 2, Phường Hạc Thành, Thanh Hóa", group: "contact" },
  { key: "browser_title", value: "Nhà xe Định Dung | Website nhà xe", group: "branding" },
  { key: "favicon_url", value: "/favicon.svg", group: "branding" },
  {
    key: "footer_text",
    value: "Dịch vụ thuê xe du lịch, cưới hỏi, sân bay và hợp đồng tại Thanh Hóa.",
    group: "branding"
  },
  { key: "group_link", value: "", group: "contact" },
  { key: "hero_background_url", value: "", group: "homepage" },
  { key: "hero_subtitle", value: "", group: "homepage" },
  { key: "hero_title", value: "", group: "homepage" },
  { key: "hotline", value: "0979860498", group: "contact" },
  { key: "logo_url", value: "", group: "branding" },
  { key: "site_name", value: "Nhà xe Định Dung", group: "branding" },
  { key: "site_tagline", value: "Dịch vụ vận tải Thanh Hóa", group: "branding" },
  { key: "zalo", value: "https://zalo.me/0979860498", group: "contact" }
];

export const PUBLIC_SITE_SETTING_KEYS = DEFAULT_SITE_SETTINGS.map((setting) => setting.key);

export async function ensureDefaultSiteSettings(prisma) {
  const existingSettings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: PUBLIC_SITE_SETTING_KEYS
      }
    },
    select: {
      key: true
    }
  });
  const existingKeys = new Set(existingSettings.map((setting) => setting.key));
  const missingSettings = DEFAULT_SITE_SETTINGS.filter((setting) => !existingKeys.has(setting.key));

  if (!missingSettings.length) {
    return;
  }

  await prisma.siteSetting.createMany({
    data: missingSettings,
    skipDuplicates: true
  });
}
