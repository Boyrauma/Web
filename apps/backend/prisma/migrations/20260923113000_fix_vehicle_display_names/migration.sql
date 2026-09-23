-- Keep the existing slugs stable so published vehicle URLs and indexed links continue to work.
UPDATE "Vehicle"
SET
  "name" = CASE "slug"
    WHEN 'santafe' THEN 'Hyundai Santa Fe'
    WHEN 'vinfat-lux-a2-0' THEN 'VinFast Lux A2.0'
    WHEN 'huyndai-solati' THEN 'Hyundai Solati'
    WHEN 'huyndai-county' THEN 'Hyundai County'
    WHEN 'huyndai-universe' THEN 'Hyundai Universe'
    ELSE "name"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" IN (
  'santafe',
  'vinfat-lux-a2-0',
  'huyndai-solati',
  'huyndai-county',
  'huyndai-universe'
);

-- Correct legacy image alt text when it was generated from the old vehicle name.
UPDATE "VehicleImage"
SET "altText" = CASE "altText"
  WHEN 'Santafe' THEN 'Hyundai Santa Fe'
  WHEN 'Vinfat Lux a2.0' THEN 'VinFast Lux A2.0'
  WHEN 'Huyndai Solati' THEN 'Hyundai Solati'
  WHEN 'Huyndai County' THEN 'Hyundai County'
  WHEN 'Huyndai Universe' THEN 'Hyundai Universe'
  ELSE "altText"
END
WHERE "altText" IN (
  'Santafe',
  'Vinfat Lux a2.0',
  'Huyndai Solati',
  'Huyndai County',
  'Huyndai Universe'
);
