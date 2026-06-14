import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface HLSVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

export function HLSVideo({ src, className, style, ...props }: HLSVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fadeIn = () => {
      video.style.opacity = "1";
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: false });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.FRAG_BUFFERED, fadeIn);
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
      video.addEventListener("canplaythrough", fadeIn);
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      style={{
        opacity: 0,
        transition: "opacity 1.6s ease",
        ...style,
      }}
      autoPlay
      loop
      muted
      playsInline
      {...props}
    />
  );
}