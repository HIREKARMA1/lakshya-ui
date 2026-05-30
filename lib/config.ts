export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
    version: process.env.NEXT_PUBLIC_API_VERSION || "v1",
    get fullUrl() {
      return `${this.baseUrl}/api/${this.version}`;
    },
  },
  app: {
    name: "LAKSHYA",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  google: {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  },
  contact: {
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || "",
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  },
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
