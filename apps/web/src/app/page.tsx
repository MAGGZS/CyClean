"use client";

import { useCallback, useEffect, useState } from "react";
import { SmoothScroll } from "../components/SmoothScroll";
import { ScrollProgress } from "../components/ScrollProgress";
import { HeroSection } from "../components/HeroSection";
import { WhySection } from "../components/WhySection";
import { ClassifierSection } from "../components/ClassifierSection";
import { Footer } from "../components/Footer";
import { VideoModal } from "../components/VideoModal";

export default function HomePage() {
  const [video, setVideo] = useState<{ id: string; titulo: string } | null>(null);

  // Acorda o serviço do Render em segundo plano (o plano gratuito hiberna)
  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);

  const abrirVideo = useCallback((id: string, titulo: string) => setVideo({ id, titulo }), []);
  const fecharVideo = useCallback(() => setVideo(null), []);

  return (
    <>
      <a
        href="#descartar"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-paper-50 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-forest-900"
      >
        Pular para o envio da foto
      </a>

      {/* Tudo que é fixed fica fora do #smooth-content */}
      <ScrollProgress />

      <div id="smooth-wrapper">
        <div id="smooth-content">
          <SmoothScroll />
          <main>
            <HeroSection onAbrirVideo={abrirVideo} />
            <WhySection />
            <ClassifierSection onAbrirVideo={abrirVideo} />
          </main>
          <Footer />
        </div>
      </div>

      <VideoModal youtubeId={video?.id ?? null} titulo={video?.titulo} onClose={fecharVideo} />
    </>
  );
}
