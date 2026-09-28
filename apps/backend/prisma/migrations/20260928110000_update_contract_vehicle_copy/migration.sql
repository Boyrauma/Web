INSERT INTO "SiteSetting" ("id", "key", "value", "group", "createdAt", "updatedAt")
VALUES
  ('copy_20260928_site_tagline', 'site_tagline', 'Xe hợp đồng 4–45 chỗ tại Thanh Hóa', 'branding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('copy_20260928_browser_title', 'browser_title', 'Nhà xe Định Dung | Thuê xe hợp đồng tại Thanh Hóa', 'branding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('copy_20260928_hero_title', 'hero_title', 'Đúng xe, đúng lịch, an tâm trọn hành trình.', 'homepage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('copy_20260928_hero_subtitle', 'hero_subtitle', 'Cho thuê xe hợp đồng từ 4 đến 45 chỗ cho du lịch, cưới hỏi, công tác, sự kiện và đưa đón sân bay.', 'homepage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET
  "value" = EXCLUDED."value",
  "group" = EXCLUDED."group",
  "updatedAt" = CURRENT_TIMESTAMP;
