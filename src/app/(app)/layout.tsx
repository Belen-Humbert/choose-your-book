import BottomNav from "@/components/BottomNav";

// Layout de las pantallas con sesión iniciada: contenido + menú inferior.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      {children}
      <BottomNav />
    </div>
  );
}
