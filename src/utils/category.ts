import type { TaskCategory } from "../models/types";

export const TASK_CATEGORIES: TaskCategory[] = ["Assignment", "Test", "Project"];

export const getCategoryClassName = (category: TaskCategory): string => {
  if (category === "Test") {
    return "category-test";
  }
  if (category === "Project") {
    return "category-project";
  }
  return "category-assignment";
};
