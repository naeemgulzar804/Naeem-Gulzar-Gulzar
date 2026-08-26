import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { Playbook } from "@/lib/types";

type PlaybookRow = Database["public"]["Tables"]["playbooks"]["Row"];

function mapPlaybook(row: PlaybookRow): Playbook {
  return {
    id: row.id,
    name: row.name,
    summary: row.summary ?? "",
    rules: row.rules ?? [],
    tags: row.tags ?? [],
  };
}

export async function getPlaybooks(): Promise<Playbook[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("playbooks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapPlaybook);
}
