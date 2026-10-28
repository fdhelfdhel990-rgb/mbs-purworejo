"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { defaultAchievements, type Achievement } from "../data/achievements";
import { safeImageUrl } from "../data/image-utils";

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="carousel-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === "left" ? (
        <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export default function AchievementCarousel({ items = defaultAchievements }: { items?: Achievement[] }) {
  const displayItems = items.slice(0, 5);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const move = useCallback((direction: number) => {
    setActive((current) =>
      (current + direction + displayItems.length) % displayItems.length,
    );
  }, [displayItems.length]);

  const temporarilyPause = useCallback((duration = 3500) => {
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused || displayItems.length < 2) return;

    const timer = window.setInterval(() => {
      move(1);
    }, 2800);

    return () => window.clearInterval(timer);
  }, [move, paused, displayItems.length]);

  const activeIndex = active % Math.max(displayItems.length, 1);
  const offsets = displayItems.length > 2 ? [-2, -1, 0, 1, 2] : displayItems.length === 2 ? [-1, 0, 1] : [0];
  const visible = offsets.map((offset) => {
    const index = (activeIndex + offset + displayItems.length) % displayItems.length;
    return { ...displayItems[index], offset, index };
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      temporarilyPause(3500);
      move(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      temporarilyPause(3500);
      move(1);
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    if (startX !== null && endX !== undefined && Math.abs(endX - startX) > 40) {
      move(endX < startX ? 1 : -1);
      temporarilyPause(3500);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="achievement-carousel"
      role="region"
      aria-label="Galeri prestasi santri"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="achievement-stage">
        <button
          className="achievement-control achievement-previous"
          type="button"
          disabled={displayItems.length < 2}
          onClick={() => {
            temporarilyPause(3500);
            move(-1);
          }}
          aria-label="Prestasi sebelumnya"
        ><Chevron direction="left" /></button>

        <div className="achievement-grid" aria-live="off">
          {visible.map((item) => (
            <article
              className={`achievement-card achievement-slide position-${item.offset + 2} ${item.offset === 0 ? "is-active" : item.offset === -1 ? "is-prev" : item.offset === 1 ? "is-next" : item.offset < 0 ? "is-far-prev" : "is-far-next"}`}
              key={displayItems.length > 2 ? item.index : `${item.index}-${item.offset}`}
              style={{ "--slide-offset": item.offset } as React.CSSProperties}
              aria-hidden={item.offset !== 0}
              onClick={() => {
                temporarilyPause(3500);
                move(item.offset);
              }}
            >
              <Image
                src={safeImageUrl(item.image, "/images/prestasi1.jpg")}
                alt={item.offset === 0 ? item.imageAlt || item.title : ""}
                fill
                sizes="(max-width: 560px) 54vw, (max-width: 900px) 32vw, 30vw"
              />
              <span className="achievement-shade" />
            </article>
          ))}
        </div>

        <button
          className="achievement-control achievement-next"
          type="button"
          disabled={displayItems.length < 2}
          onClick={() => {
            temporarilyPause(3500);
            move(1);
          }}
          aria-label="Prestasi berikutnya"
        ><Chevron direction="right" /></button>
      </div>

      <div className="achievement-caption" aria-live="polite">
        <h3 key={`title-${activeIndex}`}>{displayItems[activeIndex]?.title}</h3>
        {displayItems[activeIndex]?.detail && (
          <span key={`detail-${activeIndex}`}>{displayItems[activeIndex]?.detail}</span>
        )}
      </div>
    </div>
  );
}
