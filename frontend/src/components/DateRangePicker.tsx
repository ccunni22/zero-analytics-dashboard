import React from "react";

interface Props {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
}

const today = new Date().toISOString().split("T")[0];

const DateRangePicker: React.FC<Props> = ({
  startDate,
  endDate,
  onDateChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="bg-card-default border border-border-subtle rounded-md flex-1 p-4">
        <label
          htmlFor="start-date"
          className="block text-sm font-medium text-accent-gray mb-1"
        >
          Start Date
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          max={today}
          onChange={(e) => onDateChange(e.target.value, endDate)}
          className="w-full bg-card-default text-accent-gray px-4 py-2 rounded-md border border-border-blue focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
      </div>
      <div className="bg-card-default border border-border-subtle rounded-md flex-1 p-4">
        <label
          htmlFor="end-date"
          className="block text-sm font-medium text-accent-gray mb-1"
        >
          End Date
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          max={today}
          onChange={(e) => onDateChange(startDate, e.target.value)}
          className="w-full bg-card-default text-accent-gray px-4 py-2 rounded-md border border-border-blue focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
      </div>
    </div>
  );
};

export default DateRangePicker;
