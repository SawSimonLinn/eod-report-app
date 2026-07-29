'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export default function HeroIntro() {
  const rootRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const visualRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.set(rootRef.current, { opacity: 1 })
        .from(line1Ref.current, { y: 36, opacity: 0, duration: 0.7 })
        .from(line2Ref.current, { y: 36, opacity: 0, duration: 0.7 }, '-=0.55')
        .from(subRef.current, { y: 18, opacity: 0, duration: 0.6 }, '-=0.35')
        .from(ctaRef.current.children, { y: 14, opacity: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
        .from(visualRef.current, { y: 24, opacity: 0, duration: 0.8, rotate: 0 }, '-=0.6');

      gsap.to(visualRef.current, {
        y: '+=14',
        duration: 2.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 1.2,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero-section" ref={rootRef} style={{ opacity: 0 }}>
      <div className="hero-bg" aria-hidden="true" />
      <div className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse"></span>Store Ops Tool
          </div>
          <h1>
            <span className="line-wrap">
              <span className="line" ref={line1Ref}>
                End-of-day reports,
              </span>
            </span>
            <span className="line-wrap">
              <span className="line" ref={line2Ref}>
                written in seconds.
              </span>
            </span>
          </h1>
          <p className="sub" ref={subRef}>
            Type a quick update for each part of your shift, and get a clean, consistent report ready to paste into
            the store group chat. Built for teams running 10+ locations.
          </p>
          <div className="landing-cta" ref={ctaRef}>
            <Link href="/generate" className="btn-lg primary">
              Generate a report
            </Link>
            <Link href="/expense" className="btn-lg secondary">
              Log a gas expense
            </Link>
          </div>
        </div>

        <div className="hero-visual" ref={visualRef}>
          <div className="preview-card">
            <div className="preview-head">
              <span className="dot"></span>Report
            </div>
            <div className="preview-line preview-line-strong">FM265 PUYALLUP</div>
            <div className="preview-line">Busy afternoon rush, ran low on mango.</div>
            <div className="preview-line">Honeydew case has a few scratches — noted for facilities.</div>
            <div className="preview-line">Store is clean and fully stocked.</div>
            <div className="preview-line">Clocked out 5:15pm, no break.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
