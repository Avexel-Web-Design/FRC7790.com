import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  created_by: number;
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar', {
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
    const url = isEditMode ? `/api/calendar/${currentEvent.id}` : '/api/calendar';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentEvent)
      });

      if (response.ok) {
        await fetchEvents();
        setShowModal(false);
        setCurrentEvent(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const deleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/calendar/${eventId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setEvents(events.filter(event => event.id !== eventId));
          setShowModal(false);
          setCurrentEvent(null);
          setIsEditMode(false);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleDayClick = (day: Date) => {
    if (day.getMonth() !== currentMonth.getMonth()) return;
    setIsEditMode(false);
    setCurrentEvent({ event_date: day.toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setIsEditMode(true);
    setCurrentEvent(event);
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Calendar</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage team events, competitions, and meetings
            </p>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-md hover:bg-gray-100"
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
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
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
                  className={`bg-white px-3 py-2 text-sm min-h-[100px] cursor-pointer hover:bg-gray-50 ${
                    !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                  } ${isToday ? 'bg-blue-50' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        {event.title}
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
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {events
              .filter(event => new Date(event.event_date) >= new Date())
              .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">{event.description}</p>
                    <div className="mt-1 text-xs text-gray-400">
                      {new Date(event.event_date).toLocaleDateString()} at {event.event_time}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEventClick(event)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                </div>
              ))}
            {events.filter(event => new Date(event.event_date) >= new Date()).length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No upcoming events
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && currentEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditMode ? 'Edit Event' : 'Add New Event'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={currentEvent.title || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={currentEvent.description || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={currentEvent.event_date || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={currentEvent.event_time || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, event_time: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={currentEvent.location || ''}
                  onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <div>
                {isEditMode && user?.isAdmin && (
                  <button
                    onClick={() => deleteEvent(currentEvent.id!)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
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
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEvent}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
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