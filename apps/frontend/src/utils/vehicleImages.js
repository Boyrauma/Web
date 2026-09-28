function normalizeImageText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

const INTERIOR_IMAGE_PATTERN =
  /(^|[^a-z0-9])(noi[\s_-]*that|interior|cabin|khoang[\s_-]*(xe|khach)|ghe[\s_-]*xe)([^a-z0-9]|$)/i;

export function isInteriorVehicleImage(image) {
  const explicitType = image?.imageType ?? image?.type ?? image?.category;

  if (["interior", "exterior"].includes(explicitType)) {
    return explicitType === "interior";
  }

  const searchableText = normalizeImageText(
    [image?.altText, image?.imageUrl, image?.fullUrl, image?.originalName]
      .filter(Boolean)
      .join(" ")
  );

  return INTERIOR_IMAGE_PATTERN.test(searchableText);
}

export function getExteriorVehicleImages(images = []) {
  return images
    .filter((image) => image?.imageUrl || image?.fullUrl)
    .filter((image) => !isInteriorVehicleImage(image));
}

export function countVehicleImageTypes(images = []) {
  const interior = images.filter(isInteriorVehicleImage).length;

  return {
    exterior: images.length - interior,
    interior
  };
}
