"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import "@/lib/i18n";

type Props = {
  urls: string[];
  gridClassName?: string;
};

export function WorkplacePhotoGallery({
  urls,
  gridClassName = "grid grid-cols-2 gap-3 sm:grid-cols-3",
}: Props) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!urls.length) return null;

  const goPrev = () => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + urls.length) % urls.length);
  };

  const goNext = () => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % urls.length);
  };

  return (
    <>
      <div className={gridClassName}>
        {urls.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-soft/30 transition hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("pages.companyProfile.viewWorkplacePhoto", {
              n: i + 1,
              total: urls.length,
            })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          </button>
        ))}
      </div>

      <Dialog open={activeIndex !== null} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-5xl border-none bg-black/95 p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {t("providerDashboard.companyProfile.sections.workplace")}
          </DialogTitle>
          {activeIndex !== null ? (
            <div className="relative flex min-h-[40vh] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[activeIndex]}
                alt=""
                className="max-h-[85vh] w-full object-contain"
              />
              {urls.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-2"
                    aria-label={t("common.previous", { defaultValue: "Previous" })}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-2"
                    aria-label={t("common.next", { defaultValue: "Next" })}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <p className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                    {activeIndex + 1} / {urls.length}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
