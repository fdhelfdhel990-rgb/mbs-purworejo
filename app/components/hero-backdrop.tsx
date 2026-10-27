"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function HeroBackdrop({ src = "/images/card.jpeg" }: { src?: string }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let frame = 0;
    const updateParallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const hero = imageRef.current?.parentElement?.parentElement;
        if (hero && imageRef.current) {
          const distance = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), hero.clientHeight);
          imageRef.current.style.setProperty("--hero-parallax-y", `${distance * 0.04}px`);
        }
        frame = 0;
      });
    };

    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();
    return () => {
      window.removeEventListener("scroll", updateParallax);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hero-backdrop" aria-hidden="true">
      <Image
        ref={imageRef}
        className="hero-backdrop-image"
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
      />
    </div>
  );
}
