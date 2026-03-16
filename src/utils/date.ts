import {
  format,
  isBefore,
  isSameDay,
  isToday,
  parseISO,
  startOfToday,
  compareAsc,
} from "date-fns";
import type { Task } from "../models/types";

export const formatShortDate = (value: string): string => {
  return format(parseISO(value), "MMM d, yyyy");
};

export const toDateKey = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

export const isTaskOverdue = (task: Task): boolean => {
  if (task.completed) {
    return false;
  }

  return isBefore(parseISO(task.dueDate), startOfToday());
};

export const isDueOnDay = (task: Task, date: Date): boolean => {
  return isSameDay(parseISO(task.dueDate), date);
};

export const isTaskDueToday = (task: Task): boolean => {
  return isToday(parseISO(task.dueDate));
};

export const sortByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) =>
    compareAsc(parseISO(a.dueDate), parseISO(b.dueDate)),
  );
};
