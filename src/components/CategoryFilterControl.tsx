import type { TaskCategory } from "../models/types";

interface CategoryFilterControlProps {
  value: "all" | TaskCategory;
  onChange: (value: "all" | TaskCategory) => void;
}

export const CategoryFilterControl = ({
  value,
  onChange,
}: CategoryFilterControlProps) => {
  return (
    <label className="category-filter">
      <span>Category</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as "all" | TaskCategory)}
      >
        <option value="all">All</option>
        <option value="Assignment">Assignments</option>
        <option value="Test">Tests</option>
        <option value="Project">Projects</option>
      </select>
    </label>
  );
};
