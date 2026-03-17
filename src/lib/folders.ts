import { supabase } from "./supabase";

export async function getFolders() {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading folders:", error);
    return [];
  }

  return data;
}

export async function createFolder(name: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name,
      user_id: user.id,
    })
    .select();

  if (error) {
    console.error("Error creating folder:", error);
    return;
  }

  return data;
}

export async function deleteFolder(id: string) {
  const { error } = await supabase.from("folders").delete().eq("id", id);

  if (error) {
    console.error("Error deleting folder:", error);
  }
}