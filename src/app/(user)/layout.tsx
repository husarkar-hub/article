import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest News & Articles - Breaking News, Top Stories | NewsHub",
  description:
    "Stay updated with the latest breaking news, top-rated articles, and trending stories. Read expert insights on technology, politics, business, and more.",
  keywords:
    "breaking news, latest articles, top stories, news updates, current events, trending news, journalism, media",
  authors: [{ name: "NewsHub Editorial Team" }],
  creator: "NewsHub",
  publisher: "NewsHub Media",
  openGraph: {
    title: "Latest News & Articles - Breaking News, Top Stories | NewsHub",
    description:
      "Stay updated with the latest breaking news, top-rated articles, and trending stories. Read expert insights on technology, politics, business, and more.",
    type: "website",
    locale: "en_US",
    url: "https://yourdomain.com/",
    siteName: "NewsHub",
    images: [
      {
        url: "https://yourdomain.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NewsHub - Latest News & Articles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Latest News & Articles - Breaking News, Top Stories | NewsHub",
    description:
      "Stay updated with the latest breaking news, top-rated articles, and trending stories.",
    creator: "@newshub",
    site: "@newshub",
    images: ["https://yourdomain.com/twitter-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://yourdomain.com/",
    languages: {
      "en-US": "https://yourdomain.com/",
      "es-ES": "https://yourdomain.com/es/",
    },
  },
  category: "news",
};

const layout = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export default layout;
