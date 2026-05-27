"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { Toaster } from "react-hot-toast";
import { config } from "@/lib/config";
import i18n from "@/lib/i18n";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

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
