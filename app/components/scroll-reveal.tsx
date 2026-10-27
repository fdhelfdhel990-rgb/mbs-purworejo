"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Jangan pernah jalankan scroll-reveal atau manipulasi DOM di dalam panel admin
    if (pathname?.startsWith("/admin")) return;
    if (document.querySelector(".admin-shell, .admin-login-page, .admin-main")) return;

    const targets = document.querySelectorAll<HTMLElement>(
      "main:not(.admin-content) > section:not(.hero), main:not(.admin-content) .news-card, main:not(.admin-content) .news-detail-layout > *, main:not(.admin-content) .contact-columns > *",
    );
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" },
    );

    targets.forEach((target) => {
      target.classList.add("scroll-reveal");
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
