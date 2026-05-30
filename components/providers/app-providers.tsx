"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "react-hot-toast";
import { config } from "@/lib/config";
import i18n from "@/lib/i18n";

function syncDocumentLang(lng: string) {
  const raw = lng?.slice(0, 2) ?? "en";
  document.documentElement.lang = raw === "od" ? "or" : raw;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    syncDocumentLang(i18n.language);
    const onChange = (lng: string) => syncDocumentLang(lng);
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  const content = (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );

  if (config.google.clientId) {
    return (
      <GoogleOAuthProvider clientId={config.google.clientId}>{content}</GoogleOAuthProvider>
    );
  }

  return content;
}
