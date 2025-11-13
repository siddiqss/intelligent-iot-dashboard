import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigProvider, App as AntApp } from "antd";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

// Configure Ant Design for React compatibility
// This suppresses the React 19 compatibility warning

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IoT Intelligent Dashboard",
  description: "Real-time IoT data monitoring and AI analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConfigProvider
          theme={{
            cssVar: true,
          }}
        >
          <AntApp>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </AntApp>
        </ConfigProvider>
      </body>
    </html>
  );
}
