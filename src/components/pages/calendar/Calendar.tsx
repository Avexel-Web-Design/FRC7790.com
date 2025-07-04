import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import RecurrenceForm from '../../common/RecurrenceForm';

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

interface CalendarEvent {
  id: number | string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_end_time?: string;
  location: string;
  created_by: number;
  is_recurring?: boolean;
  recurrence?: RecurrenceConfig;
  parent_event_id?: number;
  is_recurring_instance?: boolean;
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get start and end dates for the current month view (with some buffer)
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      const response = await fetch(`/api/calendar?start=${startDate}&end=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!currentEvent) return;

    const method = isEditMode ? 'PUT' : 'POST';
    const eventId = typeof currentEvent.id === 'string' && currentEvent.id.includes('_') 
      ? currentEvent.parent_event_id 
      : currentEvent.id;
    const url = isEditMode ? `/api/calendar/${eventId}` : '/api/calendar';

    const eventData = {
      ...currentEvent,
      is_recurring: showRecurrenceOptions,
      recurrence: showRecurrenceOptions ? currentEvent.recurrence : undefined
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        await fetchEvents();
        setShowModal(false);
        setCurrentEvent(null);
        setIsEditMode(false);
        setShowRecurrenceOptions(false);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const deleteEvent = async (eventId: number | string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        
        // Handle recurring event instances
        const actualId = typeof eventId === 'string' && eventId.includes('_') 
          ? eventId.split('_')[0] 
          : eventId;
          
        const response = await fetch(`/api/calendar/${actualId}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            delete_series: typeof eventId === 'string' && eventId.includes('_'),
            exception_date: typeof eventId === 'string' && eventId.includes('_') 
              ? eventId.split('_')[1] 
              : undefined
          })
        });

        if (response.ok) {
          await fetchEvents();
          setShowModal(false);
          setCurrentEvent(null);
          setIsEditMode(false);
          setShowRecurrenceOptions(false);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleDayClick = (day: Date) => {
    if (day.getMonth() !== currentMonth.getMonth()) return;
    setIsEditMode(false);
    setShowRecurrenceOptions(false);
    setCurrentEvent({ 
      event_date: day.toISOString().split('T')[0],
      recurrence: {
        type: 'weekly',
        interval: 1,
        endType: 'never'
      }
    });
    setShowModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setIsEditMode(true);
    setShowRecurrenceOptions(!!event.is_recurring);
    
    // If this is a recurring instance, we need to handle it differently
    if (event.is_recurring_instance && event.parent_event_id) {
      // For recurring instances, we might want to fetch the parent event data
      // For now, we'll just edit this instance
      setCurrentEvent({
        ...event,
        recurrence: {
          type: 'weekly',
          interval: 1,
          endType: 'never'
        }
      });
    } else {
      setCurrentEvent({
        ...event,
        recurrence: event.recurrence || {
          type: 'weekly',
          interval: 1,
          endType: 'never'
        }
      });
    }
    
    setShowModal(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-baywatch-orange"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Team Calendar</h1>
            <p className="mt-2 text-sm text-gray-400">
              Manage team events, competitions, and meetings
            </p>
          </div>
        </div>

        <div className="bg-black border border-gray-700 rounded-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-md hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-md hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-700">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-black px-3 py-2 text-center text-xs font-medium text-gray-400 uppercase">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, dayIdx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(day);

              return (
                <div
                  key={dayIdx}
                  className={`bg-black px-3 py-2 text-sm min-h-[100px] cursor-pointer hover:bg-gray-800 ${
                    !isCurrentMonth ? 'text-gray-500' : 'text-gray-100'
                  } ${isToday ? 'bg-baywatch-orange/20' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`font-medium ${isToday ? 'text-baywatch-orange' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${
                          event.is_recurring || event.is_recurring_instance
                            ? 'bg-blue-900/25 text-blue-300 hover:bg-blue-900/40'
                            : 'bg-baywatch-orange/25 text-baywatch-orange hover:bg-baywatch-orange/40'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <div className="flex items-center space-x-1">
                          {(event.is_recurring || event.is_recurring_instance) && (
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="truncate">{event.title}</span>
                        </div>
                        {event.event_time && (
                          <div className="text-xs opacity-75 mt-0.5">
                            {event.event_time}
                            {event.event_end_time && ` - ${event.event_end_time}`}
                          </div>
                        )}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-8 bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Upcoming Events</h3>
          </div>
          <div className="divide-y divide-gray-700">
            {events
              .filter(event => new Date(event.event_date) >= new Date())
              .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-white">{event.title}</h4>
                      {event.is_recurring && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-baywatch-orange/20 text-baywatch-orange">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Recurring
                        </span>
                      )}
                      {event.is_recurring_instance && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400">
                          Instance
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(event.event_date).toLocaleDateString()}
                      {event.event_time && ` at ${event.event_time}`}
                      {event.event_end_time && ` - ${event.event_end_time}`}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventClick(event)}
                    className="text-baywatch-orange hover:text-white text-sm transition-colors"
                  >
                    Edit
                  </button>
                </div>
              ))}
            {events.filter(event => new Date(event.event_date) >= new Date()).length === 0 && (
              <div className="px-6 py-8 text-center text-gray-400">
                No upcoming events
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && currentEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 bg-black w-full max-w-2xl m-auto rounded-lg shadow-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-white mb-6">
              {isEditMode ? 'Edit Event' : 'Add New Event'}
              {currentEvent.is_recurring_instance && (
                <span className="ml-2 text-sm text-baywatch-orange">(Recurring Event)</span>
              )}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Event title"
                  value={currentEvent.title || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  placeholder="Event description"
                  value={currentEvent.description || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={currentEvent.event_date || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={currentEvent.event_time || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, event_time: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Time (Optional)</label>
                <input
                  type="time"
                  value={currentEvent.event_end_time || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, event_end_time: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Event location"
                  value={currentEvent.location || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-baywatch-orange"
                />
              </div>

              {/* Recurring Options Toggle */}
              {!currentEvent.is_recurring_instance && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showRecurrenceOptions}
                      onChange={(e) => setShowRecurrenceOptions(e.target.checked)}
                      className="rounded border-gray-600 text-baywatch-orange focus:ring-baywatch-orange"
                    />
                    <span className="text-gray-300">Make this a recurring event</span>
                  </label>
                </div>
              )}

              {/* Recurrence Form */}
              {showRecurrenceOptions && currentEvent.recurrence && (
                <div className="border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-4">Recurrence Settings</h4>
                  <RecurrenceForm
                    recurrence={currentEvent.recurrence}
                    onChange={(recurrence) => setCurrentEvent({ ...currentEvent, recurrence })}
                    eventDate={currentEvent.event_date || ''}
                  />
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <div>
                {isEditMode && user?.isAdmin && (
                  <button
                    onClick={() => deleteEvent(currentEvent.id!)}
                    className="px-4 py-2 text-sm font-medium text-red-400 bg-transparent hover:text-red-300 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setCurrentEvent(null);
                    setIsEditMode(false);
                    setShowRecurrenceOptions(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-transparent hover:text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEvent}
                  className="px-4 py-2 text-sm font-medium text-white bg-baywatch-orange hover:bg-baywatch-orange/80 rounded-md transition-colors"
                >
                  {isEditMode ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;