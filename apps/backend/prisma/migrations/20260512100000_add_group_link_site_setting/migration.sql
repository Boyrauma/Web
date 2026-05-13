INSERT INTO "SiteSetting" ("id", "key", "value", "group", "createdAt", "updatedAt")
VALUES (
  'site-setting-group-link',
  'group_link',
  '',
  'contact',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
