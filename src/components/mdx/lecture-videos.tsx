"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type LectureVideosProps = {
  videos: Record<string, string>;
};

export default function LectureVideos({ videos }: LectureVideosProps) {
  const [activeLecture, setActiveLecture] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingMap = useRef<Map<string, boolean>>(new Map());

  const getLectureKey = useCallback(
    (text: string): string | null => {
      for (const key of Object.keys(videos)) {
        if (text.includes(`[${key}]`)) return key;
      }
      return null;
    },
    [videos]
  );

  useEffect(() => {
    const h2s = document.querySelectorAll("article h2");
    if (!h2s.length) return;

    const entries: { el: Element; key: string | null }[] = [];
    h2s.forEach((h2) => {
      const text = h2.textContent || "";
      const key = getLectureKey(text);
      entries.push({ el: h2, key });
      if (key) headingMap.current.set(key, false);
    });

    observerRef.current = new IntersectionObserver(
      (observed) => {
        observed.forEach((entry) => {
          const h2 = entry.target as Element;
          const text = h2.textContent || "";
          const key = getLectureKey(text);
          if (key) {
            headingMap.current.set(key, entry.isIntersecting);
          }
        });

        const sorted = entries
          .filter((e) => e.key)
          .map((e) => ({
            el: e.el,
            key: e.key!,
            rect: e.el.getBoundingClientRect(),
          }));

        let current: string | null = null;
        for (const item of sorted) {
          if (item.rect.top <= 200) {
            current = item.key;
          }
        }

        if (current) {
          setActiveLecture(current);
          setVisible(true);
        } else {
          setVisible(false);
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] }
    );

    h2s.forEach((h2) => observerRef.current!.observe(h2));

    const onScroll = () => {
      const sorted = entries
        .filter((e) => e.key)
        .map((e) => ({
          key: e.key!,
          rect: e.el.getBoundingClientRect(),
        }));

      let current: string | null = null;
      for (const item of sorted) {
        if (item.rect.top <= 200) {
          current = item.key;
        }
      }

      if (current) {
        setActiveLecture(current);
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [getLectureKey, videos]);

  if (!activeLecture || !videos[activeLecture]) return null;

  return (
    <a
      href={videos[activeLecture]}
      target="_blank"
      rel="noopener noreferrer"
      className={`lecture-video-btn ${visible ? "lecture-video-btn--visible" : ""}`}
      aria-label={`Watch ${activeLecture} on YouTube`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
      </svg>
      <span className="lecture-video-btn__label">Watch {activeLecture.replace("Lecture ", "L")}</span>
    </a>
  );
}
