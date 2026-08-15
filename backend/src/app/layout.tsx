import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calorie Tracker API",
  description: "Separate backend API for the Nourish calorie tracker",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
