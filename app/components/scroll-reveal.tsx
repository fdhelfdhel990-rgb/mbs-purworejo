"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Only apply on public user pages, never on admin panel
    if (pathname.startsWith("/admin")) return;

    // Defer execution so React finishes hydration completely
    const timeout = setTimeout(() => {
      const selectors = [
        "main > section:not(.hero)",
        ".profile",
        ".values",
        ".values-list article",
        ".achievements",
        ".news-section",
        ".news-card",
        ".faq",
        ".faq-item",
        ".admission",
        ".schedule",
        ".news-search",
        ".news-page-grid .news-card",
        ".news-article",
        ".detail-sidebar",
        ".contact-intro",
        ".visit-form",
        ".contact-location",
        ".site-footer .footer-main",
      ];

      const elements = Array.from(document.querySelectorAll<HTMLElement>(selectors.join(", ")));
      if (!elements.length) return;

      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        elements.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.08,
          rootMargin: "0px 0px -40px 0px",
        },
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If already visible on initial load or after refresh midway, reveal immediately
        if (rect.top < window.innerHeight * 0.88 && rect.bottom > 0) {
          el.classList.add("is-visible");
        } else {
          el.classList.add("scroll-reveal");
          observer.observe(el);
        }
      });

      return () => observer.disconnect();
    }, 200);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
