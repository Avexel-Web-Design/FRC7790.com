import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import NebulaLoader from '@/components/common/NebulaLoader';
import frcAPI from '@/utils/frcApiClient';
import { useAuth } from '@/contexts/AuthContext';

// Utility function to format time from 24-hour to 12-hour format
const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h24 = parseInt(hours, 10);
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  return `${h12}:${minutes} ${ampm}`;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  // Local inline recurrence form to avoid importing 7790 files
  const RecurrenceForm = ({ recurrence, onChange, eventDate }) => {
    const daysOfWeek = [
      { value: 'sunday', label: 'Sun' },
      { value: 'monday', label: 'Mon' },
      { value: 'tuesday', label: 'Tue' },
      { value: 'wednesday', label: 'Wed' },
      { value: 'thursday', label: 'Thu' },
      { value: 'friday', label: 'Fri' },
      { value: 'saturday', label: 'Sat' },
    ];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const weekOfMonthOptions = [
      { value: 1, label: 'First' },
      { value: 2, label: 'Second' },
      { value: 3, label: 'Third' },
      { value: 4, label: 'Fourth' },
      { value: -1, label: 'Last' },
    ];
    const getEventDayOfWeek = () => {
      if (!eventDate) return 'monday';
      const d = new Date(eventDate + 'T00:00:00');
      return daysOfWeek[d.getDay()].value;
    };
    const getEventDayOfMonth = () => {
      if (!eventDate) return 1;
      return new Date(eventDate + 'T00:00:00').getDate();
    };
    const getEventWeekOfMonth = () => {
      if (!eventDate) return 1;
      const d = new Date(eventDate + 'T00:00:00');
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const off = d.getDate() + first.getDay() - 1;
      return Math.floor(off / 7) + 1;
    };
    const update = (u) => onChange({ ...recurrence, ...u });
    const toggleDay = (day) => {
      const cur = recurrence.daysOfWeek || [getEventDayOfWeek()];
      const upd = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day];
      update({ daysOfWeek: upd });
    };
    const toggleMonth = (idx) => {
      const cur = recurrence.months || [];
      const upd = cur.includes(idx + 1) ? cur.filter(m => m !== idx + 1) : [...cur, idx + 1];
      update({ months: upd });
    };
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Repeat</label>
          <select value={recurrence.type} onChange={(e)=>update({ type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Every</label>
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="99" value={recurrence.interval}
                   onChange={(e)=>update({ interval: parseInt(e.target.value)||1 })}
                   className="w-20 bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
            <span className="text-gray-300">
              {recurrence.type === 'daily' && (recurrence.interval === 1 ? 'day' : 'days')}
              {recurrence.type === 'weekly' && (recurrence.interval === 1 ? 'week' : 'weeks')}
              {recurrence.type === 'monthly' && (recurrence.interval === 1 ? 'month' : 'months')}
              {recurrence.type === 'yearly' && (recurrence.interval === 1 ? 'year' : 'years')}
            </span>
          </div>
        </div>
        {recurrence.type === 'weekly' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">On days</label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(d => (
                <button key={d.value} type="button" onClick={()=>toggleDay(d.value)}
                        className={(recurrence.daysOfWeek||[getEventDayOfWeek()]).includes(d.value)
                          ? 'px-3 py-1 rounded text-sm font-medium bg-sca-purple text-white'
                          : 'px-3 py-1 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600'}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {recurrence.type === 'monthly' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="monthlyType" checked={!!recurrence.dayOfMonth}
                     onChange={()=>update({ dayOfMonth: getEventDayOfMonth(), weekOfMonth: undefined, dayOfWeek: undefined })}
                     className="text-sca-purple focus:ring-sca-purple"/>
              <span className="text-gray-300">On day</span>
              <input type="number" min="1" max="31" value={recurrence.dayOfMonth||getEventDayOfMonth()}
                     onChange={(e)=>update({ dayOfMonth: parseInt(e.target.value)||1 })}
                     disabled={!recurrence.dayOfMonth}
                     className="w-16 bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sca-purple disabled:opacity-50"/>
              <span className="text-gray-300">of the month</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="monthlyType" checked={!!recurrence.weekOfMonth && !!recurrence.dayOfWeek}
                     onChange={()=>update({ weekOfMonth: getEventWeekOfMonth(), dayOfWeek: getEventDayOfWeek(), dayOfMonth: undefined })}
                     className="text-sca-purple focus:ring-sca-purple"/>
              <span className="text-gray-300">On the</span>
              <select value={recurrence.weekOfMonth||getEventWeekOfMonth()} onChange={(e)=>update({ weekOfMonth: parseInt(e.target.value) })}
                      disabled={!recurrence.weekOfMonth}
                      className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sca-purple disabled:opacity-50">
                {weekOfMonthOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
              <select value={recurrence.dayOfWeek||getEventDayOfWeek()} onChange={(e)=>update({ dayOfWeek: e.target.value })}
                      disabled={!recurrence.weekOfMonth}
                      className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sca-purple disabled:opacity-50">
                {daysOfWeek.map(d => (<option key={d.value} value={d.value}>{d.label}</option>))}
              </select>
            </label>
          </div>
        )}
        {recurrence.type === 'yearly' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">In months</label>
            <div className="grid grid-cols-3 gap-2">
              {months.map((m, i) => (
                <button key={m} type="button" onClick={()=>toggleMonth(i)}
                        className={(recurrence.months||[new Date(eventDate + 'T00:00:00').getMonth()+1]).includes(i+1)
                          ? 'px-3 py-2 rounded text-sm font-medium bg-sca-purple text-white'
                          : 'px-3 py-2 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600'}>
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Ends</label>
          <label className="flex items-center gap-2">
            <input type="radio" name="endType" value="never" checked={recurrence.endType==='never'}
                   onChange={()=>onChange({ ...recurrence, endType: 'never' })}
                   className="text-sca-purple focus:ring-sca-purple"/>
            <span className="text-gray-300">Never</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="endType" value="after_occurrences" checked={recurrence.endType==='after_occurrences'}
                   onChange={()=>onChange({ ...recurrence, endType: 'after_occurrences' })}
                   className="text-sca-purple focus:ring-sca-purple"/>
            <span className="text-gray-300">After</span>
            <input type="number" min="1" max="999" value={recurrence.occurrences||10}
                   onChange={(e)=>onChange({ ...recurrence, occurrences: parseInt(e.target.value)||10 })}
                   disabled={recurrence.endType!=='after_occurrences'}
                   className="w-20 bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sca-purple disabled:opacity-50"/>
            <span className="text-gray-300">occurrences</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="endType" value="end_date" checked={recurrence.endType==='end_date'}
                   onChange={()=>onChange({ ...recurrence, endType: 'end_date' })}
                   className="text-sca-purple focus:ring-sca-purple"/>
            <span className="text-gray-300">On</span>
            <input type="date" value={recurrence.endDate||''} min={eventDate}
                   onChange={(e)=>onChange({ ...recurrence, endDate: e.target.value })}
                   disabled={recurrence.endType!=='end_date'}
                   className="bg-gray-800 border border-gray-600 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sca-purple disabled:opacity-50"/>
          </label>
        </div>
      </div>
    );
  };

  const fetchEvents = async () => {
    try {
      // Buffer a month on each side
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      const res = await frcAPI.get(`/calendar?start=${startDate}&end=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error('Error fetching events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [currentMonth]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const out = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      out.push(d);
    }
    return out;
  }, [currentMonth]);

  const getEventsForDate = (date) => {
    const ds = date.toISOString().split('T')[0];
    return events.filter(e => e.event_date === ds);
  };

  const navigateMonth = (dir) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1));

  const handleDayClick = (day) => {
    if (day.getMonth() !== currentMonth.getMonth()) return;
    setIsEditMode(false);
    setShowRecurrenceOptions(false);
    setCurrentEvent({
      event_date: day.toISOString().split('T')[0],
      recurrence: { type: 'weekly', interval: 1, endType: 'never' },
    });
    setShowModal(true);
  };

  const handleEventClick = async (event) => {
    setIsEditMode(true);
    setShowRecurrenceOptions(!!event.is_recurring);
    if (event.is_recurring_instance && event.parent_event_id) {
      // fetch parent for recurrence details
      try {
        const res = await frcAPI.get(`/calendar/${event.parent_event_id}`);
        if (res.ok) {
          const parent = await res.json();
          setCurrentEvent({
            ...event,
            recurrence: {
              type: parent.recurrence_type || 'weekly',
              interval: parent.recurrence_interval || 1,
              daysOfWeek: parent.recurrence_days_of_week ? JSON.parse(parent.recurrence_days_of_week) : undefined,
              dayOfMonth: parent.recurrence_day_of_month,
              weekOfMonth: parent.recurrence_week_of_month,
              dayOfWeek: parent.recurrence_day_of_week,
              months: parent.recurrence_months ? JSON.parse(parent.recurrence_months) : undefined,
              endType: parent.recurrence_end_type || 'never',
              endDate: parent.recurrence_end_date,
              occurrences: parent.recurrence_occurrences,
              exceptions: parent.recurrence_exceptions ? JSON.parse(parent.recurrence_exceptions) : [],
            },
          });
        } else {
          setCurrentEvent({ ...event, recurrence: { type: 'weekly', interval: 1, endType: 'never' } });
        }
      } catch {
        setCurrentEvent({ ...event, recurrence: { type: 'weekly', interval: 1, endType: 'never' } });
      }
    } else if (event.is_recurring) {
      setCurrentEvent({
        ...event,
        recurrence: {
          type: event.recurrence_type || 'weekly',
          interval: event.recurrence_interval || 1,
          daysOfWeek: event.recurrence_days_of_week ? JSON.parse(event.recurrence_days_of_week) : undefined,
          dayOfMonth: event.recurrence_day_of_month,
          weekOfMonth: event.recurrence_week_of_month,
          dayOfWeek: event.recurrence_day_of_week,
          months: event.recurrence_months ? JSON.parse(event.recurrence_months) : undefined,
          endType: event.recurrence_end_type || 'never',
          endDate: event.recurrence_end_date,
          occurrences: event.recurrence_occurrences,
          exceptions: event.recurrence_exceptions ? JSON.parse(event.recurrence_exceptions) : [],
        },
      });
    } else {
      setCurrentEvent({ ...event, recurrence: { type: 'weekly', interval: 1, endType: 'never' } });
    }
    setShowModal(true);
  };

  const saveEvent = async () => {
    if (!currentEvent) return;
    const isInstance = typeof currentEvent.id === 'string' && currentEvent.id.includes('_');
    let eventId = currentEvent.id;
    if (isInstance) eventId = currentEvent.parent_event_id;
    const url = isEditMode ? `/calendar/${eventId}` : '/calendar';
    const method = isEditMode ? 'PUT' : 'POST';
    const payload = {
      ...currentEvent,
      is_recurring: isEditMode ? (currentEvent.is_recurring || currentEvent.is_recurring_instance || showRecurrenceOptions) : showRecurrenceOptions,
      recurrence: ((isEditMode && (currentEvent.is_recurring || currentEvent.is_recurring_instance)) || showRecurrenceOptions) ? currentEvent.recurrence : undefined,
      update_series: currentEvent?.update_series || false,
      original_instance_date: isInstance ? currentEvent.id.split('_')[1] : undefined,
    };
    const res = await frcAPI[method.toLowerCase()](url, payload);
    if (res.ok) {
      await fetchEvents();
      setShowModal(false);
      setCurrentEvent(null);
      setIsEditMode(false);
      setShowRecurrenceOptions(false);
    }
  };

  const deleteEvent = async (eventId) => {
    const isInstance = typeof eventId === 'string' && eventId.includes('_');
    const isRecurringEvent = currentEvent?.is_recurring || currentEvent?.is_recurring_instance;
    let deleteAllSeries = false;
    if (isInstance || isRecurringEvent) {
      if (currentEvent?.update_series) {
        deleteAllSeries = true;
      } else {
        const result = window.confirm('This is a recurring event.\n\nOK = Just this instance\nCancel = Delete the entire series');
        deleteAllSeries = !result;
        if (result === null) return;
      }
    } else if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    const actualId = isInstance ? eventId.split('_')[0] : eventId;
    const res = await frcAPI.request('DELETE', `/calendar/${actualId}`, {
      delete_series: deleteAllSeries,
      exception_date: isInstance && !deleteAllSeries ? eventId.split('_')[1] : undefined,
    });
    if (res.ok) {
      await fetchEvents();
      setShowModal(false);
      setCurrentEvent(null);
      setIsEditMode(false);
      setShowRecurrenceOptions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <NebulaLoader size={96} />
      </div>
    );
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-semibold">Team Calendar</h1>
          <p className="text-sm text-gray-400">Manage team events, competitions, and meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>navigateMonth(-1)} className="p-2 rounded-md hover:text-sca-gold" aria-label="Previous month" title="Previous month">
            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
          </button>
          <div className="text-gray-300">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</div>
          <button onClick={()=>navigateMonth(1)} className="p-2 rounded-md hover:text-sca-gold" aria-label="Next month" title="Next month">
            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="border border-white/10 rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-white/10">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
              <div key={d} className="bg-black px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase">{d}</div>
            ))}
            {days.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(day);
              return (
       <div key={idx}
         className={`bg-black px-3 py-1 sm:py-2 text-sm min-h-[80px] sm:min-h-[110px] cursor-pointer hover:bg-white/5 ${!isCurrentMonth ? 'text-gray-500' : 'text-gray-100'} ${isToday ? 'ring-1 ring-sca-purple/60' : ''}`}
         onClick={()=>handleDayClick(day)}>
                  <div className={`font-medium ${isToday ? 'text-sca-gold' : ''}`}>{day.getDate()}</div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0,3).map((event) => (
                      <div key={event.id}
                           className={`text-xs -mx-3 px-0 py-1 sm:mx-0 sm:px-1 rounded truncate cursor-pointer transition-colors ${ (event.is_recurring || event.is_recurring_instance) ? 'bg-sca-purple/25 text-sca-gold hover:bg-sca-purple/40' : 'bg-sca-purple/25 text-sca-gold hover:bg-sca-purple/40'}`}
                           onClick={(e)=>{ e.stopPropagation(); handleEventClick(event); }}>
                        <div className="flex items-center gap-1">
                          {(event.is_recurring || event.is_recurring_instance) && (<span>⟳</span>)}
                          <span className="truncate">{event.title}</span>
                        </div>
                        {event.event_time && (
                          <div className="text-xs opacity-75 mt-0.5">
                            {formatTime(event.event_time)}{event.event_end_time && ` - ${formatTime(event.event_end_time)}`}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && currentEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative p-8 bg-black w-full max-w-2xl m-auto rounded-lg shadow-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-6">
              {isEditMode ? 'Edit Event' : 'Add New Event'}
              {currentEvent.is_recurring_instance && (
                <span className="ml-2 text-sm text-sca-gold">(Recurring Event)</span>
              )}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input type="text" value={currentEvent.title||''} onChange={(e)=>setCurrentEvent({ ...currentEvent, title: e.target.value })}
                       className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea value={currentEvent.description||''} onChange={(e)=>setCurrentEvent({ ...currentEvent, description: e.target.value })}
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input type="date" value={currentEvent.event_date||''}
                         onChange={(e)=>setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                         className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input type="time" value={currentEvent.event_time||''}
                         onChange={(e)=>setCurrentEvent({ ...currentEvent, event_time: e.target.value })}
                         className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time (Optional)</label>
                <input type="time" value={currentEvent.event_end_time||''}
                       onChange={(e)=>setCurrentEvent({ ...currentEvent, event_end_time: e.target.value })}
                       className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input type="text" value={currentEvent.location||''}
                       onChange={(e)=>setCurrentEvent({ ...currentEvent, location: e.target.value })}
                       className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>

              <div className="space-y-4">
                {!isEditMode && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showRecurrenceOptions} onChange={(e)=>setShowRecurrenceOptions(e.target.checked)}
                           className="rounded border-gray-600 text-sca-purple focus:ring-sca-purple"/>
                    <span className="text-gray-300">Make this a recurring event</span>
                  </label>
                )}
                {isEditMode && (currentEvent.is_recurring || currentEvent.is_recurring_instance) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300">{currentEvent.is_recurring_instance ? 'Part of recurring series' : 'Recurring event'}</span>
                      <button type="button" onClick={()=>setShowRecurrenceOptions(!showRecurrenceOptions)} className="text-sm text-sca-gold hover:text-white">
                        {showRecurrenceOptions ? 'Hide' : 'Edit'} recurrence settings
                      </button>
                    </div>
                    {currentEvent.is_recurring_instance && (
                      <div className="text-sm text-gray-400 bg-gray-800 p-3 rounded border border-gray-600">
                        <p className="mb-2">You're editing a single occurrence of a recurring event.</p>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={currentEvent.update_series||false} onChange={(e)=>setCurrentEvent({ ...currentEvent, update_series: e.target.checked })}
                                 className="rounded border-gray-600 text-sca-purple focus:ring-sca-purple"/>
                          <span>Apply changes to entire series</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
                {isEditMode && !currentEvent.is_recurring && !currentEvent.is_recurring_instance && (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={showRecurrenceOptions} onChange={(e)=>setShowRecurrenceOptions(e.target.checked)}
                           className="rounded border-gray-600 text-sca-purple focus:ring-sca-purple"/>
                    <span className="text-gray-300">Make this a recurring event</span>
                  </label>
                )}
              </div>

              {showRecurrenceOptions && currentEvent.recurrence && (
                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-4">Recurrence Settings</h4>
                  <RecurrenceForm recurrence={currentEvent.recurrence} onChange={(rec)=>setCurrentEvent({ ...currentEvent, recurrence: rec })} eventDate={currentEvent.event_date||''} />
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <div>
                {isEditMode && user?.isAdmin && (
                  <button onClick={()=>deleteEvent(currentEvent.id)} className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300">Delete</button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>{ setShowModal(false); setCurrentEvent(null); setIsEditMode(false); setShowRecurrenceOptions(false); }}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white">Cancel</button>
                <button onClick={saveEvent} className="px-4 py-2 text-sm font-medium text-black bg-sca-gold hover:bg-yellow-400 rounded">{isEditMode ? 'Save Changes' : 'Create Event'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
