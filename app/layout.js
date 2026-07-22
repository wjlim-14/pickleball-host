import "./globals.css";

export const metadata = {
  title: "PicklePlay — Host Console",
  description: "Auto-arranging paddle queue for pickleball open play.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f6e56",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
