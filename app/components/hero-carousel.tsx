"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { safeImageUrl } from "../data/image-utils";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6" />
      ) : (
        <path d="m9 18 6-6-6-6" />
      )}
    </svg>
  );
}

export type HeroSlideItem = {
  image: string;
  hasLink?: boolean;
  linkUrl?: string;
  openInNewTab?: boolean;
};

export default function HeroCarousel({
  slides,
  images,
  src,
}: {
  slides?: HeroSlideItem[];
  images?: string[];
  src?: string;
}) {
  const resolvedSlides: HeroSlideItem[] = Array.isArray(slides) && slides.length > 0
    ? slides
    : Array.isArray(images) && images.length > 0
    ? images.map((img) => ({ image: img, hasLink: false, linkUrl: "" }))
    : [{ image: src || "/images/card.jpeg", hasLink: false, linkUrl: "" }];

  const safeSlides = resolvedSlides
    .slice(0, 3)
    .map((item) => ({
      ...item,
      image: safeImageUrl(item.image, "/images/card.jpeg"),
    }));

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const total = safeSlides.length;
  const activeSlide = safeSlides[activeIndex] || safeSlides[0];

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index % total);
  }, [total]);

  const temporarilyPause = useCallback((duration = 5000) => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, duration);
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;

    let frame = 0;
    const updateParallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const hero = containerRef.current?.closest(".hero");
        if (hero && containerRef.current) {
          const distance = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), hero.clientHeight);
          containerRef.current.style.setProperty("--hero-parallax-y", `${distance * 0.04}px`);
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

  // Pause auto-play when hovering anywhere inside .hero
  useEffect(() => {
    const hero = containerRef.current?.closest(".hero");
    if (!hero) return;

    const onEnter = () => setIsPaused(true);
    const onLeave = () => setIsPaused(false);

    hero.addEventListener("mouseenter", onEnter);
    hero.addEventListener("mouseleave", onLeave);

    return () => {
      hero.removeEventListener("mouseenter", onEnter);
      hero.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Pause when browser tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Auto-play interval (every 5 seconds)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [total, isPaused, nextSlide]);

  // Touch swipe handling on .hero
  useEffect(() => {
    const hero = containerRef.current?.closest<HTMLElement>(".hero");
    if (!hero || total <= 1) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - startX;
      const deltaY = e.changedTouches[0].clientY - startY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        temporarilyPause(5000);
      }
    };

    hero.addEventListener("touchstart", handleTouchStart, { passive: true });
    hero.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      hero.removeEventListener("touchstart", handleTouchStart);
      hero.removeEventListener("touchend", handleTouchEnd);
    };
  }, [total, nextSlide, prevSlide, temporarilyPause]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="hero-backdrop" aria-hidden="true">
        {safeSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={`${slide.image}-${index}`}
              className={`hero-slide ${isActive ? "is-active" : ""}`}
            >
              <Image
                className="hero-backdrop-image"
                src={slide.image}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                unoptimized
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.srcset = "";
                  target.src = "/images/card.jpeg";
                }}
              />
            </div>
          );
        })}
      </div>

      {activeSlide.hasLink && activeSlide.linkUrl && (
        <a
          href={activeSlide.linkUrl}
          target={activeSlide.openInNewTab ? "_blank" : undefined}
          rel={activeSlide.openInNewTab ? "noopener noreferrer" : undefined}
          className="hero-slide-clickable"
          title="Klik untuk membuka tautan banner"
          aria-label="Tautan banner aktif"
        />
      )}

      {total > 1 && (
        <div className="hero-carousel-controls">
          <button
            type="button"
            className="hero-carousel-arrow prev"
            onClick={() => {
              prevSlide();
              temporarilyPause(5000);
            }}
            aria-label="Banner sebelumnya"
          >
            <Chevron direction="left" />
          </button>

          <button
            type="button"
            className="hero-carousel-arrow next"
            onClick={() => {
              nextSlide();
              temporarilyPause(5000);
            }}
            aria-label="Banner berikutnya"
          >
            <Chevron direction="right" />
          </button>

          <div
            className="hero-carousel-dots"
            role="tablist"
            aria-label="Pilih banner"
          >
            {safeSlides.map((_, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Banner slide ${index + 1}`}
                  className={`hero-carousel-dot ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    goToSlide(index);
                    temporarilyPause(5000);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
