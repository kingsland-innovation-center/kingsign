import LayoutWithNav from "../../components/layout/layoutWithNav";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  return <LayoutWithNav>{children}</LayoutWithNav>;
}
