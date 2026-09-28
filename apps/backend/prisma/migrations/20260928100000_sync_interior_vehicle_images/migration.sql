-- Ship the interior gallery added in local administration to every deployment.
-- Existing rows with the same image URL are preserved to avoid duplicates.
INSERT INTO "VehicleImage" (
  "id",
  "vehicleId",
  "imageUrl",
  "altText",
  "imageType",
  "isPrimary",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  data."id",
  vehicle."id",
  data."imageUrl",
  data."altText",
  'interior'::"VehicleImageType",
  false,
  data."sortOrder",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('pkg_20260928_universe_int_1', 'huyndai-universe', '/image/vehicles/1790561853263-noi-that-xe-bong2.webp', 'Nội thất Hyundai Universe 1', 2),
    ('pkg_20260928_universe_int_2', 'huyndai-universe', '/image/vehicles/1790561853259-noi-that-xe-bong-3.webp', 'Nội thất Hyundai Universe 2', 3),
    ('pkg_20260928_universe_int_3', 'huyndai-universe', '/image/vehicles/1790561853262-noi-that-xe-bong.webp', 'Nội thất Hyundai Universe 3', 4),
    ('pkg_20260928_evergreen_int_1', 'thaco-evergreen', '/image/vehicles/1790561865460-noi-that-xe-bong2.webp', 'Nội thất Thaco Evergreen 1', 2),
    ('pkg_20260928_evergreen_int_2', 'thaco-evergreen', '/image/vehicles/1790561865457-noi-that-xe-bong-3.webp', 'Nội thất Thaco Evergreen 2', 3),
    ('pkg_20260928_evergreen_int_3', 'thaco-evergreen', '/image/vehicles/1790561865459-noi-that-xe-bong.webp', 'Nội thất Thaco Evergreen 3', 4),
    ('pkg_20260928_lux_int_1', 'vinfat-lux-a2-0', '/image/vehicles/1790561930422-noi-that-vinfat-lux-a2-1.webp', 'Nội thất VinFast Lux A2.0 1', 2),
    ('pkg_20260928_lux_int_2', 'vinfat-lux-a2-0', '/image/vehicles/1790561930417-noi-that-vinfat-lux-a2-0.webp', 'Nội thất VinFast Lux A2.0 2', 3),
    ('pkg_20260928_county_int_1', 'huyndai-county', '/image/vehicles/1790561954960-noi-that-xe-county-2.webp', 'Nội thất Hyundai County 1', 4),
    ('pkg_20260928_county_int_2', 'huyndai-county', '/image/vehicles/1790561954962-noi-that-xe-county.webp', 'Nội thất Hyundai County 2', 5),
    ('pkg_20260928_solati_int_1', 'huyndai-solati', '/image/vehicles/1790561971482-noi-that-xe-16-cho-1.webp', 'Nội thất Hyundai Solati 1', 2),
    ('pkg_20260928_solati_int_2', 'huyndai-solati', '/image/vehicles/1790561971484-noi-that-xe-16-cho-2.webp', 'Nội thất Hyundai Solati 2', 3),
    ('pkg_20260928_solati_int_3', 'huyndai-solati', '/image/vehicles/1790561971485-noi-that-xe-16-cho-3.webp', 'Nội thất Hyundai Solati 3', 4),
    ('pkg_20260928_santafe_int_1', 'santafe', '/image/vehicles/1790561988585-noi-that-xe-santafe.webp', 'Nội thất Hyundai Santa Fe 1', 2),
    ('pkg_20260928_santafe_int_2', 'santafe', '/image/vehicles/1790561988585-noi-that-xe-santafe1.webp', 'Nội thất Hyundai Santa Fe 2', 3)
) AS data("id", "slug", "imageUrl", "altText", "sortOrder")
JOIN "Vehicle" AS vehicle ON vehicle."slug" = data."slug"
WHERE NOT EXISTS (
  SELECT 1
  FROM "VehicleImage" AS existing_image
  WHERE existing_image."imageUrl" = data."imageUrl"
)
ON CONFLICT ("id") DO NOTHING;
