import { Navbar } from "@/components/ui/Navbar/Navbar";

export default function LayoutWithNav({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 p-6 scrollbar-hide overflow-hidden">
        {children}
      </main>
    </div>
  );
}
