import React from 'react';

interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: string[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  dayOfWeek?: string;
  months?: number[];
  endType: 'never' | 'after_occurrences' | 'end_date';
  endDate?: string;
  occurrences?: number;
  exceptions?: string[];
}

interface RecurrenceFormProps {
  recurrence: RecurrenceConfig;
  onChange: (recurrence: RecurrenceConfig) => void;
  eventDate: string;
}

const RecurrenceForm: React.FC<RecurrenceFormProps> = ({ recurrence, onChange, eventDate }) => {
  const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' }
  ];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const weekOfMonthOptions = [
    { value: 1, label: 'First' },
    { value: 2, label: 'Second' },
    { value: 3, label: 'Third' },
    { value: 4, label: 'Fourth' },
    { value: -1, label: 'Last' }
  ];

  const updateRecurrence = (updates: Partial<RecurrenceConfig>) => {
    onChange({ ...recurrence, ...updates });
  };

  const toggleDayOfWeek = (day: string) => {
    const current = recurrence.daysOfWeek || [getEventDayOfWeek()];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    updateRecurrence({ daysOfWeek: updated });
  };

  const toggleMonth = (month: number) => {
    const current = recurrence.months || [];
    const updated = current.includes(month)
      ? current.filter(m => m !== month)
      : [...current, month];
    updateRecurrence({ months: updated });
  };

  const getEventDayOfWeek = () => {
    if (!eventDate) return 'monday';
    const date = new Date(eventDate + 'T00:00:00');
    return daysOfWeek[date.getDay()].value;
  };

  const getEventDayOfMonth = () => {
    if (!eventDate) return 1;
    const date = new Date(eventDate + 'T00:00:00');
    return date.getDate();
  };

  const getEventWeekOfMonth = () => {
    if (!eventDate) return 1;
    const date = new Date(eventDate + 'T00:00:00');
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstWeekday = firstDay.getDay();
    const offsetDate = date.getDate() + firstWeekday - 1;
    return Math.floor(offsetDate / 7) + 1;
  };

  return (
    <div className="space-y-4">
      {/* Recurrence Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Repeat</label>
        <select
          value={recurrence.type}
          onChange={(e) => updateRecurrence({ type: e.target.value as RecurrenceConfig['type'] })}
          className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Interval */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Every
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max="99"
            value={recurrence.interval}
            onChange={(e) => updateRecurrence({ interval: parseInt(e.target.value) || 1 })}
            className="w-20 bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
          />
          <span className="text-gray-300">
            {recurrence.type === 'daily' && (recurrence.interval === 1 ? 'day' : 'days')}
            {recurrence.type === 'weekly' && (recurrence.interval === 1 ? 'week' : 'weeks')}
            {recurrence.type === 'monthly' && (recurrence.interval === 1 ? 'month' : 'months')}
            {recurrence.type === 'yearly' && (recurrence.interval === 1 ? 'year' : 'years')}
          </span>
        </div>
      </div>

      {/* Weekly Options */}
      {recurrence.type === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">On days</label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDayOfWeek(day.value)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  (recurrence.daysOfWeek || [getEventDayOfWeek()]).includes(day.value)
                    ? 'bg-baywatch-orange text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {day.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Options */}
      {recurrence.type === 'monthly' && (
        <div className="space-y-3">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="monthlyType"
                checked={!!recurrence.dayOfMonth}
                onChange={() => updateRecurrence({ 
                  dayOfMonth: getEventDayOfMonth(), 
                  weekOfMonth: undefined, 
                  dayOfWeek: undefined 
                })}
                className="text-baywatch-orange focus:ring-baywatch-orange"
              />
              <span className="text-gray-300">On day</span>
              <input
                type="number"
                min="1"
                max="31"
                value={recurrence.dayOfMonth || getEventDayOfMonth()}
                onChange={(e) => updateRecurrence({ dayOfMonth: parseInt(e.target.value) || 1 })}
                disabled={!recurrence.dayOfMonth}
                className="w-16 bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-baywatch-orange disabled:opacity-50"
              />
              <span className="text-gray-300">of the month</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="monthlyType"
                checked={!!recurrence.weekOfMonth && !!recurrence.dayOfWeek}
                onChange={() => updateRecurrence({ 
                  weekOfMonth: getEventWeekOfMonth(), 
                  dayOfWeek: getEventDayOfWeek(),
                  dayOfMonth: undefined 
                })}
                className="text-baywatch-orange focus:ring-baywatch-orange"
              />
              <span className="text-gray-300">On the</span>
              <select
                value={recurrence.weekOfMonth || getEventWeekOfMonth()}
                onChange={(e) => updateRecurrence({ weekOfMonth: parseInt(e.target.value) })}
                disabled={!recurrence.weekOfMonth}
                className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-baywatch-orange disabled:opacity-50"
              >
                {weekOfMonthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={recurrence.dayOfWeek || getEventDayOfWeek()}
                onChange={(e) => updateRecurrence({ dayOfWeek: e.target.value })}
                disabled={!recurrence.weekOfMonth}
                className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-baywatch-orange disabled:opacity-50"
              >
                {daysOfWeek.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Yearly Options */}
      {recurrence.type === 'yearly' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">In months</label>
          <div className="grid grid-cols-3 gap-2">
            {months.map(month => (
              <button
                key={month.value}
                type="button"
                onClick={() => toggleMonth(month.value)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  (recurrence.months || [new Date(eventDate + 'T00:00:00').getMonth() + 1]).includes(month.value)
                    ? 'bg-baywatch-orange text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {month.label.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* End Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Ends</label>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="never"
              checked={recurrence.endType === 'never'}
              onChange={() => updateRecurrence({ endType: 'never' })}
              className="text-baywatch-orange focus:ring-baywatch-orange"
            />
            <span className="text-gray-300">Never</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="after_occurrences"
              checked={recurrence.endType === 'after_occurrences'}
              onChange={() => updateRecurrence({ endType: 'after_occurrences' })}
              className="text-baywatch-orange focus:ring-baywatch-orange"
            />
            <span className="text-gray-300">After</span>
            <input
              type="number"
              min="1"
              max="999"
              value={recurrence.occurrences || 10}
              onChange={(e) => updateRecurrence({ occurrences: parseInt(e.target.value) || 10 })}
              disabled={recurrence.endType !== 'after_occurrences'}
              className="w-20 bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-baywatch-orange disabled:opacity-50"
            />
            <span className="text-gray-300">occurrences</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="endType"
              value="end_date"
              checked={recurrence.endType === 'end_date'}
              onChange={() => updateRecurrence({ endType: 'end_date' })}
              className="text-baywatch-orange focus:ring-baywatch-orange"
            />
            <span className="text-gray-300">On</span>
            <input
              type="date"
              value={recurrence.endDate || ''}
              onChange={(e) => updateRecurrence({ endDate: e.target.value })}
              disabled={recurrence.endType !== 'end_date'}
              min={eventDate}
              className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-baywatch-orange disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
        <div className="text-sm text-gray-300">
          <strong className="text-gray-100">Summary:</strong>
          <div className="mt-1">
            {formatRecurrenceDescription(recurrence)}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatRecurrenceDescription(config: RecurrenceConfig): string {
  const { type, interval, daysOfWeek, endType, endDate, occurrences } = config;

  let description = '';

  // Base pattern
  switch (type) {
    case 'daily':
      description = interval === 1 ? 'Daily' : `Every ${interval} days`;
      break;
    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        const dayList = daysOfWeek.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
        description = interval === 1 ? 
          `Weekly on ${dayList}` : 
          `Every ${interval} weeks on ${dayList}`;
      } else {
        description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      }
      break;
    case 'monthly':
      description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
      break;
    case 'yearly':
      description = interval === 1 ? 'Annually' : `Every ${interval} years`;
      break;
  }

  // End condition
  switch (endType) {
    case 'after_occurrences':
      description += `, ${occurrences} times`;
      break;
    case 'end_date':
      if (endDate) {
        const date = new Date(endDate);
        description += `, until ${date.toLocaleDateString()}`;
      }
      break;
  }

  return description;
}

export default RecurrenceForm;
