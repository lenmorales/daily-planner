import { useMemo, useState } from "react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { format, parseISO } from "date-fns";
import type { Folder, Task, TaskCategory } from "../models/types";
import { CategoryFilterControl } from "./CategoryFilterControl";
import { EmptyState } from "./EmptyState";
import {
  isDueOnDay,
  isTaskDueToday,
  isTaskOverdue,
  sortByDueDate,
} from "../utils/date";
import { getCategoryClassName } from "../utils/category";

interface CalendarViewProps {
  tasks: Task[];
  folders: Folder[];
  selectedDate: string | null;
  categoryFilter: "all" | TaskCategory;
  onChangeCategoryFilter: (value: "all" | TaskCategory) => void;
  enableCompletionTracking: boolean;
  onToggleComplete: (task: Task) => void;
  onSelectDate: (date: string) => void;
}

export const CalendarView = ({
  tasks,
  folders,
  selectedDate,
  categoryFilter,
  onChangeCategoryFilter,
  enableCompletionTracking,
  onToggleComplete,
  onSelectDate,
}: CalendarViewProps) => {
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const selected = selectedDate ? parseISO(selectedDate) : new Date();
  const selectedTasks = sortByDueDate(tasks.filter((task) => isDueOnDay(task, selected)));
  const folderById = folders.reduce<Record<string, Folder>>((accumulator, folder) => {
    accumulator[folder.id] = folder;
    return accumulator;
  }, {});
  const events = useMemo<EventInput[]>(() => {
    return tasks.map((task) => {
      const categoryClass = getCategoryClassName(task.category);
      return {
        id: task.id,
        title: task.title,
        date: task.dueDate,
        classNames: ["calendar-event", categoryClass, isTaskOverdue(task) ? "is-overdue" : ""],
        extendedProps: {
          taskId: task.id,
        },
      };
    });
  }, [tasks]);

  const onDateClick = (arg: DateClickArg) => {
    onSelectDate(arg.dateStr);
    setHighlightedTaskId(null);
  };

  const onEventClick = (arg: EventClickArg) => {
    onSelectDate(arg.event.startStr.slice(0, 10));
    setHighlightedTaskId(arg.event.id);
  };

  return (
    <section className="content-panel">
      <div className="panel-title">
        <div className="panel-title-main">
          <h2>Calendar</h2>
          <p>Category-colored calendar synced directly with your task store.</p>
        </div>
        <CategoryFilterControl
          value={categoryFilter}
          onChange={onChangeCategoryFilter}
        />
      </div>

      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          height="auto"
          fixedWeekCount={false}
          dayMaxEvents={3}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </div>

      <div className="due-list">
        <h3>
          Due on {format(selected, "MMMM d, yyyy")}
        </h3>
        {selectedTasks.length === 0 ? (
          <EmptyState
            title="No tasks due"
            description="This date has no due tasks. Pick another date in the calendar."
          />
        ) : (
          <ul>
            {selectedTasks.map((task) => (
              <li
                key={task.id}
                className={`${task.completed ? "is-completed" : ""} ${
                  isTaskOverdue(task) ? "is-overdue" : ""
                } ${isTaskDueToday(task) && !task.completed ? "is-due-today" : ""} ${
                  highlightedTaskId === task.id ? "is-highlighted" : ""
                } ${getCategoryClassName(task.category)}`}
              >
                <span>
                  <strong>{task.title}</strong>
                  <em>
                    {task.subject} • {task.folderId ? folderById[task.folderId]?.name : "Unassigned"}
                  </em>
                </span>
                <span className={`category-badge ${getCategoryClassName(task.category)}`}>
                  {task.category}
                </span>
                {enableCompletionTracking ? (
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task)}
                    aria-label={`Toggle completion for ${task.title}`}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
