import { motion } from "motion/react";

interface BlurTextProps {
  text: string;
  className?: string;
  delayPerWord?: number;
}

export function BlurText({ text, className, delayPerWord = 0.1 }: BlurTextProps) {
  const words = text.split(" ");

  return (
    <span className={className} style={{ display: "inline" }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(12px)", y: 18 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{
            delay: i * delayPerWord,
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: "inline-block", marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
