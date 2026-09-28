CREATE TYPE "VehicleImageType" AS ENUM ('exterior', 'interior');

ALTER TABLE "VehicleImage"
ADD COLUMN "imageType" "VehicleImageType" NOT NULL DEFAULT 'exterior';

-- Preserve the classifications that were previously inferred from image metadata.
UPDATE "VehicleImage"
SET "imageType" = 'interior'
WHERE LOWER(COALESCE("altText", '') || ' ' || COALESCE("imageUrl", '')) LIKE ANY (
  ARRAY[
    '%nội thất%',
    '%noi-that%',
    '%noi_that%',
    '%noi that%',
    '%interior%',
    '%cabin%',
    '%khoang-xe%',
    '%khoang_xe%',
    '%khoang xe%',
    '%ghe-xe%',
    '%ghe_xe%',
    '%ghe xe%'
  ]
);
