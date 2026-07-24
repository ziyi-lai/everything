import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/sidebar";
import { CommandPalette } from "@/components/shared/command-palette";
import { TimerShell } from "@/components/time/timer-shell";
import { TimerDock } from "@/components/time/quick-timer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TimerShell>
      <div className="flex w-full">
        <Sidebar email={user?.email} />
        <CommandPalette />
        <main className="min-w-0 flex-1 px-16 py-12">{children}</main>
        <TimerDock />
      </div>
    </TimerShell>
  );
}
