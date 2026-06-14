import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FeaturesChessProps {
  isDark: boolean;
}

const CANVAS_IMG =
  "https://images.unsplash.com/photo-1761122827167-159d1d272313?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZGVzaWduJTIwc29mdHdhcmUlMjBjYW52YXMlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzc3Mjc5MzM2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const BRAND_IMG =
  "https://images.unsplash.com/photo-1647675559000-3ca04e672688?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFuZCUyMGNvbG9yJTIwcGFsZXR0ZSUyMHR5cG9ncmFwaHklMjBkZXNpZ258ZW58MXx8fHwxNzc3Mjc5MzM3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export function FeaturesChess({ isDark }: FeaturesChessProps) {
  const fg = isDark ? "#fff" : "#0d0d0d";
  const fgMuted = isDark ? "rgba(255,255,255,0.58)" : "rgba(0,0,0,0.55)";
  const labelColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)";

  const rows = [
    {
      reverse: false,
      label: "Canvas",
      title: "The Ultimate Whiteboard",
      body: "Experience an immersive dark mode canvas with highly vibrant creative tools, sticky notes, and dynamic layouts.",
      img: CANVAS_IMG,
    },
    {
      reverse: true,
      label: "Identity",
      title: "Brandkit and Typography",
      body: "Generate color palettes based on psychology and test fonts with intelligent pairing suggestions.",
      img: BRAND_IMG,
    },
  ];

  return (
    <section id="features-chess" className="w-full px-6 lg:px-20 py-24 relative overflow-hidden">
      {/* Ambient color blobs */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-10%",
            width: "500px",
            height: "400px",
            borderRadius: "50%",
            background: isDark ? "rgba(0,200,120,0.12)" : "rgba(0,160,100,0.07)",
            filter: "blur(100px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-8%",
            width: "460px",
            height: "380px",
            borderRadius: "50%",
            background: isDark ? "rgba(100,50,255,0.14)" : "rgba(80,40,200,0.07)",
            filter: "blur(110px)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-28 relative" style={{ zIndex: 1 }}>
        {rows.map((row, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col ${row.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 lg:gap-20 items-center`}
          >
            {/* Text */}
            <div className="flex-1 flex flex-col justify-center">
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "0.72rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: labelColor,
                  marginBottom: "16px",
                  display: "block",
                }}
              >
                {row.label}
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontStyle: "italic",
                  fontSize: "clamp(2rem, 3.5vw, 2.8rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-1.5px",
                  color: fg,
                  marginBottom: "20px",
                }}
              >
                {row.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: fgMuted,
                  maxWidth: "420px",
                }}
              >
                {row.body}
              </p>
            </div>

            {/* Visual */}
            <div className="flex-1">
              <div
                className="liquid-glass rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "16/10",
                  position: "relative",
                }}
              >
                <ImageWithFallback
                  src={row.img}
                  alt={row.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    filter: isDark ? "brightness(0.85) saturate(1.1)" : "brightness(1) saturate(1)",
                  }}
                />
                {/* Glass tint overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isDark
                      ? "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.1) 100%)"
                      : "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(200,200,220,0.1) 100%)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}