
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, Link as LinkIcon, MapPin, Plus, ExternalLink, Trash2, X } from 'lucide-react';
import { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  
  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'meeting' | 'deadline' | 'campaign'>('meeting');
  const [newEventPlatform, setNewEventPlatform] = useState<'Google Meet' | 'Zoom' | 'Teams'>('Google Meet');
  const [newEventDesc, setNewEventDesc] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // --- Navigation Handlers ---
  const prevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // --- Event Handlers ---
  const handleDayClick = (day: number) => {
    const date = new Date(year, currentDate.getMonth(), day);
    setNewEventDate(date);
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventType('meeting');
    setIsCreateOpen(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEventTitle || !newEventDate) return;

      // Simulate Link Generation for Meetings
      const mockLink = newEventType === 'meeting' 
        ? `https://meet.google.com/${Math.random().toString(36).substring(7)}`
        : undefined;

      const newEvent: CalendarEvent = {
          id: `evt-${Date.now()}`,
          title: newEventTitle,
          description: newEventDesc,
          start: newEventDate.getTime(),
          end: newEventDate.getTime() + 3600000, // Default 1 hour duration
          type: newEventType,
          platform: newEventType === 'meeting' ? newEventPlatform : undefined,
          meetingLink: mockLink
      };

      onAddEvent(newEvent);
      setIsCreateOpen(false);
  };

  const handleDelete = () => {
      if(selectedEvent && confirm('Are you sure you want to delete this event?')) {
          onDeleteEvent(selectedEvent.id);
          setSelectedEvent(null);
      }
  };

  // --- Render Helpers ---
  const getEventColor = (type: string) => {
      switch(type) {
          case 'meeting': return 'bg-blue-100 text-blue-700 border-l-4 border-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
          case 'deadline': return 'bg-red-100 text-red-700 border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-300';
          case 'campaign': return 'bg-purple-100 text-purple-700 border-l-4 border-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
          default: return 'bg-gray-100 text-gray-700 border-l-4 border-gray-500';
      }
  };

  const renderDays = () => {
    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 dark:bg-slate-900/30 border-b border-r border-gray-200 dark:border-slate-800"></div>);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, currentDate.getMonth(), d).setHours(0,0,0,0);
      const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && year === new Date().getFullYear();
      
      const daysEvents = events.filter(e => {
          const eventDate = new Date(e.start).setHours(0,0,0,0);
          return eventDate === dateStr;
      });

      days.push(
        <div 
            key={d} 
            onClick={() => handleDayClick(d)}
            className={`min-h-[120px] border-b border-r border-gray-200 dark:border-slate-800 p-2 transition-colors hover:bg-indigo-50/20 dark:hover:bg-slate-800/50 group relative cursor-pointer ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
        >
          <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-bold inline-flex w-7 h-7 items-center justify-center rounded-full ${
                  isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 dark:text-slate-300'
              }`}>
                {d}
              </span>
              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity">
                 <Plus size={16} />
              </button>
          </div>
          
          <div className="space-y-1.5">
            {daysEvents.map((event) => (
                <div 
                    key={event.id} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                    }}
                    className={`text-xs p-1.5 rounded shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${getEventColor(event.type)}`}
                >
                    <div className="font-semibold truncate">{event.title}</div>
                    {event.type === 'meeting' && <div className="text-[10px] opacity-75 flex items-center gap-1"><Video size={8}/> {new Date(event.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>}
                    {event.type === 'deadline' && <div className="text-[10px] opacity-75 flex items-center gap-1"><Clock size={8}/> Due Date</div>}
                </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="text-indigo-600" />
                {monthName} {year}
            </h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
            <ChevronLeft size={20} className="text-gray-600 dark:text-slate-300" />
          </button>
          <button onClick={goToToday} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
            <ChevronRight size={20} className="text-gray-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            {day.slice(0, 3)}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        {renderDays()}
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800">
                  <div className={`p-6 ${
                      selectedEvent.type === 'meeting' ? 'bg-blue-600' : 
                      selectedEvent.type === 'deadline' ? 'bg-red-600' : 'bg-purple-600'
                  } text-white relative`}>
                      <button 
                        onClick={() => setSelectedEvent(null)}
                        className="absolute top-4 right-4 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                          <X size={20} />
                      </button>
                      <div className="flex items-center gap-2 mb-2 opacity-90 text-xs font-bold uppercase tracking-wider">
                          {selectedEvent.type === 'meeting' ? <Video size={14}/> : <Clock size={14}/>}
                          {selectedEvent.type}
                      </div>
                      <h3 className="text-2xl font-bold leading-tight">{selectedEvent.title}</h3>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="space-y-4">
                          <div className="flex items-start gap-3">
                              <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500">
                                  <Clock size={20} />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">Date & Time</p>
                                  <p className="text-sm text-gray-500 dark:text-slate-400">
                                      {new Date(selectedEvent.start).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}
                                      <br/>
                                      {new Date(selectedEvent.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(selectedEvent.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </p>
                              </div>
                          </div>

                          {selectedEvent.description && (
                              <div className="flex items-start gap-3">
                                  <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500">
                                      <ExternalLink size={20} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">Description</p>
                                      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{selectedEvent.description}</p>
                                  </div>
                              </div>
                          )}

                          {selectedEvent.type === 'meeting' && (
                              <div className="flex items-start gap-3">
                                  <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500">
                                      <MapPin size={20} />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-900 dark:text-white">Platform</p>
                                      <p className="text-sm text-gray-500 dark:text-slate-400">{selectedEvent.platform || 'Online Meeting'}</p>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                          {selectedEvent.type === 'meeting' && selectedEvent.meetingLink && (
                              <a 
                                href={selectedEvent.meetingLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                              >
                                  <Video size={18} /> Join Meeting
                              </a>
                          )}
                          
                          {selectedEvent.type === 'deadline' && (
                              <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none">
                                  <ExternalLink size={18} /> View Task
                              </button>
                          )}

                          <button 
                             onClick={handleDelete}
                             className="px-4 py-3 border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                              <Trash2 size={20} />
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateOpen && newEventDate && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                  <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-950">
                      <h3 className="font-bold text-gray-900 dark:text-white">Add New Event</h3>
                      <button onClick={() => setIsCreateOpen(false)}><X size={20} className="text-gray-500"/></button>
                  </div>
                  
                  <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title</label>
                          <input 
                            type="text" 
                            autoFocus
                            required
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g. Client Sync" 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                              <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                                  {newEventDate.toLocaleDateString()}
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                              <select 
                                value={newEventType}
                                onChange={(e) => setNewEventType(e.target.value as any)}
                                className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              >
                                  <option value="meeting">Meeting</option>
                                  <option value="deadline">Deadline</option>
                                  <option value="campaign">Campaign</option>
                              </select>
                          </div>
                      </div>

                      {newEventType === 'meeting' && (
                           <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Platform</label>
                              <select 
                                value={newEventPlatform}
                                onChange={(e) => setNewEventPlatform(e.target.value as any)}
                                className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm"
                              >
                                  <option value="Google Meet">Google Meet</option>
                                  <option value="Zoom">Zoom</option>
                                  <option value="Teams">Microsoft Teams</option>
                              </select>
                              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                  <LinkIcon size={10} /> A meeting link will be generated automatically.
                              </p>
                           </div>
                      )}

                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (Optional)</label>
                          <textarea 
                             value={newEventDesc}
                             onChange={(e) => setNewEventDesc(e.target.value)}
                             className="w-full p-3 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm resize-none"
                             rows={3}
                             placeholder="Add details..."
                          />
                      </div>

                      <div className="pt-2">
                          <button 
                            type="submit"
                            disabled={!newEventTitle}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              Create Event
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
