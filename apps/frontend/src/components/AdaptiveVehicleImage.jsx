import { useState } from "react";

export default function AdaptiveVehicleImage({
  src,
  alt,
  className = "",
  loading,
  decoding
}) {
  const [isPortrait, setIsPortrait] = useState(false);

  function handleLoad(event) {
    const image = event.currentTarget;
    setIsPortrait(image.naturalHeight > image.naturalWidth);
  }

  return (
    <>
      {isPortrait ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          decoding="async"
          className="vehicle-stage-image-backdrop"
        />
      ) : null}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        className={`vehicle-stage-image ${
          isPortrait ? "vehicle-stage-image-portrait" : ""
        } ${className}`.trim()}
      />
    </>
  );
}
