import { supabase } from "./supabase";

export async function getTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading tasks:", error);
    return [];
  }

  return data;
}

export async function createTask(task: Record<string, unknown>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("User not logged in");
    return;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...task,
      user_id: user.id,
    })
    .select();

  if (error) {
    console.error("Error creating task:", error);
    return;
  }

  return data;
}

export async function updateTask(task: Record<string, unknown>) {
  const { id, ...updates } = task;

  if (!id) {
    console.error("Task id is required for update");
    return;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating task:", error);
    return;
  }

  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    console.error("Error deleting task:", error);
  }
}
