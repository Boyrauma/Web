-- Replace legacy vehicle image references with the verified WebP files bundled in
-- apps/backend/packaged-uploads. Vehicle slugs stay unchanged to preserve URLs.
DELETE FROM "VehicleImage"
WHERE "vehicleId" IN (
  SELECT "id"
  FROM "Vehicle"
  WHERE "slug" IN (
    'huyndai-county',
    'huyndai-solati',
    'huyndai-universe',
    'santafe',
    'thaco-evergreen',
    'vinfat-lux-a2-0'
  )
);

INSERT INTO "VehicleImage" (
  "id", "vehicleId", "imageUrl", "altText", "isPrimary", "sortOrder", "createdAt", "updatedAt"
)
SELECT data."id", vehicle."id", data."imageUrl", data."altText", data."isPrimary", data."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('pkg_20260923_county_0', 'huyndai-county', '/image/vehicles/1790133492850-xecountytrang.webp', 'Hyundai County', true, 0),
    ('pkg_20260923_county_1', 'huyndai-county', '/image/vehicles/1790133492850-xecountytrang2.webp', 'Hyundai County', false, 1),
    ('pkg_20260923_county_2', 'huyndai-county', '/image/vehicles/1790133492852-xecountyxanh.webp', 'Hyundai County', false, 2),
    ('pkg_20260923_county_3', 'huyndai-county', '/image/vehicles/1790133492854-xecountyxanh2.webp', 'Hyundai County', false, 3),
    ('pkg_20260923_solati_0', 'huyndai-solati', '/image/vehicles/1790133506877-xe16cho.webp', 'Hyundai Solati', true, 0),
    ('pkg_20260923_solati_1', 'huyndai-solati', '/image/vehicles/1790133506878-xe16cho2.webp', 'Hyundai Solati', false, 1),
    ('pkg_20260923_universe_0', 'huyndai-universe', '/image/vehicles/1790133422000-xe45cho.webp', 'Hyundai Universe', true, 0),
    ('pkg_20260923_universe_1', 'huyndai-universe', '/image/vehicles/1790133422001-xe45cho2.webp', 'Hyundai Universe', false, 1),
    ('pkg_20260923_santafe_0', 'santafe', '/image/vehicles/1790133554410-xe7cho.webp', 'Hyundai Santa Fe', true, 0),
    ('pkg_20260923_santafe_1', 'santafe', '/image/vehicles/1790133520372-xe7cho2.webp', 'Hyundai Santa Fe', false, 1),
    ('pkg_20260923_evergreen_0', 'thaco-evergreen', '/image/vehicles/1790133448784-xecountybonghoi.webp', 'Thaco Evergreen', true, 0),
    ('pkg_20260923_evergreen_1', 'thaco-evergreen', '/image/vehicles/1790133448784-xecountybonghoi2.webp', 'Thaco Evergreen', false, 1),
    ('pkg_20260923_lux_0', 'vinfat-lux-a2-0', '/image/vehicles/1790133466252-xe4cho.webp', 'VinFast Lux A2.0', true, 0),
    ('pkg_20260923_lux_1', 'vinfat-lux-a2-0', '/image/vehicles/1790133466252-xe4cho2.webp', 'VinFast Lux A2.0', false, 1)
) AS data("id", "slug", "imageUrl", "altText", "isPrimary", "sortOrder")
JOIN "Vehicle" AS vehicle ON vehicle."slug" = data."slug";

INSERT INTO "SiteSetting" ("id", "key", "value", "group", "createdAt", "updatedAt")
VALUES
  ('pkg_20260923_logo', 'logo_url', '/image/branding/1790133358728-logo.webp', 'branding', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('pkg_20260923_hero', 'hero_background_url', '/image/branding/1790133364863-hero.webp', 'homepage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP;
