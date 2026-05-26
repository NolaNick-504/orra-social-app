import type { Metadata } from 'next';

// Layout for the catch-all SPA route.
// This ensures Next.js treats all /explore, /profile, /messages etc.
// as valid routes with the same metadata as the home page.
// Without this layout, Next.js client router may resolve the RSC
// flight data "c":["","explore"] and show a 404 because it can't
// find a matching static route segment.
export const metadata: Metadata = {
  title: 'ORRA - Social Media Super App',
  description: 'The next-gen social media experience. Pulse, Prism, Dance Challenges, and more.',
};

export default function SpaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
