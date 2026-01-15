
import React, { useState, useRef, useMemo } from 'react';
<<<<<<< HEAD
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Clock, Video, Link as LinkIcon, MapPin, Plus, ExternalLink, Trash2, X, MoreVertical, UserPlus, Users, Link2, Repeat, Check, Edit2, Target, Bell, CheckCircle } from 'lucide-react';
import { CalendarEvent, User, SystemSettings } from '../types';

interface CalendarViewProps {
    events: CalendarEvent[];
    users: User[];
    onAddEvent: (event: CalendarEvent) => void;
    onUpdateEvent?: (id: string, event: Partial<CalendarEvent>) => void;
    onDeleteEvent: (id: string) => void;
    onViewTask: (taskId: string) => void;
    onToggleComplete?: (event: CalendarEvent) => void;
    onNotifyParticipants?: (event: CalendarEvent) => void;
    themeColor: string;
    settings: SystemSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, users, onAddEvent, onUpdateEvent, onDeleteEvent, onViewTask, onToggleComplete, onNotifyParticipants, themeColor, settings }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const themeColors: any = {
        indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', shadow: 'shadow-indigo-500/20', hover: 'hover:bg-indigo-700', accent: 'text-indigo-400', accentBg: 'bg-indigo-500/10' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-600', shadow: 'shadow-emerald-500/20', hover: 'hover:bg-emerald-700', accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10' },
        rose: { text: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-600', shadow: 'shadow-rose-500/20', hover: 'hover:bg-rose-700', accent: 'text-rose-400', accentBg: 'bg-rose-500/10' },
        blue: { text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600', shadow: 'shadow-blue-500/20', hover: 'hover:bg-blue-700', accent: 'text-blue-400', accentBg: 'bg-blue-500/10' },
        violet: { text: 'text-violet-600', bg: 'bg-violet-600', border: 'border-violet-600', shadow: 'shadow-violet-500/20', hover: 'hover:bg-violet-700', accent: 'text-violet-400', accentBg: 'bg-violet-500/10' },
        orange: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', shadow: 'shadow-orange-500/20', hover: 'hover:bg-orange-700', accent: 'text-orange-400', accentBg: 'bg-orange-500/10' },
    };

    const activeTheme = themeColors[themeColor] || themeColors.indigo;

    // Modals State
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const [selectedViewDate, setSelectedViewDate] = useState<Date | null>(null);

    // New Event Form State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventType, setNewEventType] = useState<'meeting' | 'deadline' | 'campaign'>('meeting');
    const [newEventPlatform, setNewEventPlatform] = useState<'Google Meet' | 'Zoom' | 'Teams'>('Google Meet');
    const [newEventLink, setNewEventLink] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

    // New Time & Recurrence State
    const [isAllDay, setIsAllDay] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();

    // --- Navigation Handlers ---
    const prevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));

    const upcomingEvents = useMemo(() => {
        let filtered = events.filter(e => {
            const isPast = new Date(e.end).getTime() < Date.now();
            return !isPast && !e.completed;
        });

        if (selectedViewDate) {
            filtered = filtered.filter(e => {
                const eventStart = new Date(e.start);
                return eventStart.getDate() === selectedViewDate.getDate() &&
                    eventStart.getMonth() === selectedViewDate.getMonth() &&
                    eventStart.getFullYear() === selectedViewDate.getFullYear();
            });
        } else {
            // If no date selected, show next 5 upcoming
            return filtered.sort((a, b) => a.start - b.start).slice(0, 5);
        }

        return filtered.sort((a, b) => a.start - b.start);
    }, [events, selectedViewDate]);

    const handleDayClick = (day: number) => {
        const date = new Date(year, currentDate.getMonth(), day);
        setSelectedViewDate(date);
    };

    const handleOpenCreateModal = () => {
        setNewEventDate(selectedViewDate || new Date());
        setNewEventTitle('');
        setNewEventDesc('');
        setNewEventLink('');
        setNewEventType('meeting');
        setSelectedAttendees([]);
        setIsAllDay(false);
        setIsRecurring(false);
        setStartTime('09:00');
        setEndTime('10:00');
        setEditingEventId(null);
        setIsCreateOpen(true);
    };

    const toggleAttendee = (userId: string) => {
        setSelectedAttendees(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleEditClick = (event: CalendarEvent) => {
        setEditingEventId(event.id);
        setNewEventTitle(event.title);
        setNewEventDesc(event.description || '');
        setNewEventLink(event.meetingLink || '');
        setNewEventType(event.type);
        setNewEventPlatform(event.platform || 'Google Meet');
        setSelectedAttendees(event.attendeeIds || []);
        setIsAllDay(!!event.allDay);
        setIsRecurring(!!event.recurring);

        const start = new Date(event.start);
        const end = new Date(event.end);
        setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
        setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
        setNewEventDate(new Date(event.start));

        setSelectedEvent(null);
        setIsCreateOpen(true);
    };

    const handleCreateEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle || !newEventDate) return;

        const start = new Date(newEventDate);
        const [sh, sm] = startTime.split(':').map(Number);
        start.setHours(sh, sm);

        const end = new Date(newEventDate);
        const [eh, em] = endTime.split(':').map(Number);
        end.setHours(eh, em);

        const eventData: Partial<CalendarEvent> = {
            title: newEventTitle,
            description: newEventDesc,
            start: start.getTime(),
            end: end.getTime(),
            allDay: isAllDay,
            recurring: isRecurring,
            type: newEventType,
            platform: newEventType === 'meeting' ? newEventPlatform : undefined,
            meetingLink: newEventLink,
            attendeeIds: selectedAttendees
        };

        if (editingEventId && onUpdateEvent) {
            onUpdateEvent(editingEventId, eventData);
        } else {
            onAddEvent({
                ...eventData as CalendarEvent,
                id: `evt-${Date.now()}`
            });
        }
        setIsCreateOpen(false);
        setEditingEventId(null);
    };

    const renderDays = () => {
        const days = [];
        const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

        // Empty boxes for previous month days
        for (let i = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i > 0; i--) {
            const dayNum = prevMonthLastDay - i + 1;
            days.push(
                <div key={`prev-${dayNum}`} className="aspect-square p-2 opacity-20 bg-slate-100 dark:bg-[#1e2235]/30 rounded-2xl flex items-center justify-center text-gray-500 font-bold text-lg m-1">
                    {dayNum}
                </div>
            );
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, currentDate.getMonth(), d).setHours(0, 0, 0, 0);
            const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && year === new Date().getFullYear();

            const dayEvents = events.filter(e => new Date(e.start).setHours(0, 0, 0, 0) === dateStr);
            const hasEvents = dayEvents.length > 0;

            days.push(
                <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className={`aspect-square p-2 rounded-2xl transition-all cursor-pointer relative m-1 flex flex-col items-center justify-center group ${isToday ? `${activeTheme.bg} text-white shadow-xl ${activeTheme.shadow}` :
                        hasEvents ? 'bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-[#282c45]' : 'bg-slate-50 dark:bg-[#1e2235] hover:bg-slate-100 dark:hover:bg-[#282c45]'
                        }`}
                >
                    <span className={`text-xl font-bold ${hasEvents && !isToday ? 'text-gray-900 dark:text-white' : isToday ? 'text-white' : 'text-gray-400'}`}>{d}</span>

                    {hasEvents && (
                        <div className="mt-2 flex -space-x-1.5 overflow-hidden">
                            {dayEvents.flatMap(e => e.attendeeIds || []).slice(0, 3).map((uid, idx) => {
                                const user = users.find(u => u.id === uid);
                                return user ? <img key={idx} src={user.avatar} className="w-5 h-5 rounded-full border border-white dark:border-[#1e2235]" alt="att" /> : null;
                            })}
                        </div>
                    )}

                    {hasEvents && !isToday && (
                        <div className="mt-1 flex gap-1 justify-center">
                            <div className={`w-2 h-2 rounded-full ${activeTheme.bg}`}></div>
                            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-gray-600"></div>
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="h-full flex flex-col lg:flex-row bg-white dark:bg-[#151a21] rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-[#2a303c]/30 transition-colors">

            {/* Calendar Grid Area */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter capitalize">
                            {monthName} <span className="text-gray-400 dark:text-gray-500">{year}</span>
                        </h2>
                        <button className={`${activeTheme.text} hover:opacity-80 transition-colors`}><ChevronDown size={24} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={prevMonth} className="p-3 bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-gray-600 dark:text-white transition-all"><ChevronLeft size={24} /></button>
                        <button onClick={nextMonth} className="p-3 bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-gray-600 dark:text-white transition-all"><ChevronRight size={24} /></button>
                        <button onClick={handleOpenCreateModal} className={`ml-4 ${activeTheme.bg} ${activeTheme.hover} text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg ${activeTheme.shadow}`}>
                            <UserPlus size={20} /> Novo Evento
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 mb-4">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                        <div key={day} className="text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest py-4">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {renderDays()}
                </div>
            </div>

            {/* Sidebar Event List */}
            <div className="w-full lg:w-[400px] bg-slate-50 dark:bg-[#0b0e11] p-10 flex flex-col border-l border-gray-100 dark:border-white/5 overflow-y-auto custom-scrollbar">
                <div className="mb-10">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {selectedViewDate
                            ? `Agenda: ${selectedViewDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
                            : 'Próximos Eventos'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedViewDate
                            ? 'Eventos agendados para este dia'
                            : 'Gerencie seu cronograma de produção'}
                    </p>
                </div>

                <div className="space-y-6">
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4 text-gray-400 dark:text-gray-500">
                            <CalendarIcon size={48} />
                            <p className="text-xs font-black uppercase tracking-widest">Sem eventos próximos</p>
                        </div>
                    ) : (
                        upcomingEvents.map(event => (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group relative shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[10px] font-black ${activeTheme.text} uppercase tracking-widest`}>{new Date(event.start).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><MoreVertical size={16} /></button>
                                </div>
                                <h4 className={`text-lg font-black text-gray-900 dark:text-white mb-4 leading-tight ${event.completed ? 'line-through opacity-50' : ''}`}>{event.completed && <CheckCircle className="inline w-4 h-4 mr-1 text-green-500" />}{event.title}</h4>

                                <div className="flex items-center gap-6 mb-4">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <Clock size={14} className={activeTheme.text} />
                                        {event.allDay ? 'Dia Inteiro' : `${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </div>
                                </div>

                                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${activeTheme.bg} w-2/3`}></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* CREATE/EDIT EVENT MODAL */}
            {isCreateOpen && newEventDate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#151a21] w-full max-w-5xl rounded-[40px] shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[780px] relative">

                        {/* Left Panel: Form Content */}
                        <div className="flex-[1.6] p-10 overflow-y-auto custom-scrollbar space-y-8 bg-white dark:bg-[#151a21]">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{editingEventId ? 'Editar Item da Agenda' : 'Novo Item na Agenda'}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Planeje sua produção sincronizada com o time.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Título do Evento</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        required
                                        value={newEventTitle}
                                        onChange={(e) => setNewEventTitle(e.target.value)}
                                        className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold placeholder:text-gray-300 dark:placeholder:text-gray-800"
                                        placeholder="ex: Revisão Criativa"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Tipo</label>
                                        <div className="relative">
                                            <select
                                                value={newEventType}
                                                onChange={(e) => setNewEventType(e.target.value as any)}
                                                className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl font-bold outline-none appearance-none"
                                            >
                                                <option value="meeting">Reunião</option>
                                                <option value="deadline">Prazo</option>
                                                <option value="campaign">Campanha</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Plataforma (Opcional)</label>
                                        <div className="relative">
                                            <select
                                                value={newEventPlatform}
                                                onChange={(e) => setNewEventPlatform(e.target.value as any)}
                                                className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl font-bold outline-none appearance-none"
                                            >
                                                <option value="Google Meet">Google Meet</option>
                                                <option value="Zoom">Zoom</option>
                                                <option value="Teams">Teams</option>
                                            </select>
                                            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Time & Options Area */}
                                <div className="bg-slate-50 dark:bg-[#151a2e]/50 p-6 rounded-3xl border border-gray-200 dark:border-white/5 space-y-6">
                                    <div className="flex flex-wrap items-center gap-6">
                                        <button
                                            type="button"
                                            onClick={() => setIsAllDay(!isAllDay)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAllDay ? `${activeTheme.bg} text-white shadow-lg ${activeTheme.shadow}` : 'bg-white dark:bg-[#0b0e11] text-gray-500 border border-gray-200 dark:border-white/5'}`}
                                        >
                                            {isAllDay && <Check size={14} />} Dia Todo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsRecurring(!isRecurring)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecurring ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'bg-white dark:bg-[#0b0e11] text-gray-500 border border-gray-200 dark:border-white/5'}`}
                                        >
                                            {isRecurring ? <Repeat size={14} /> : <Repeat size={14} className="opacity-30" />} Recorrente
                                        </button>
                                    </div>

                                    {!isAllDay && (
                                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block">Início</label>
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    className="w-full p-4 bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-mono text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block">Fim</label>
                                                <input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    className="w-full p-4 bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-mono text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Link da Reunião</label>
                                    <div className="relative">
                                        <Link2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={newEventLink}
                                            onChange={(e) => setNewEventLink(e.target.value)}
                                            className="w-full p-5 pl-14 bg-slate-50 dark:bg-[#151a2e] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                                            placeholder="https://meet.google.com/..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Descrição</label>
                                    <textarea
                                        value={newEventDesc}
                                        onChange={(e) => setNewEventDesc(e.target.value)}
                                        className="w-full p-6 bg-slate-50 dark:bg-[#151a2e] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-[32px] text-sm resize-none h-32 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-800"
                                        placeholder="Adicione notas para o time..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Panel: Side Actions & Team */}
                        <div className="flex-1 bg-slate-50 dark:bg-[#0b0e11] p-10 flex flex-col border-l border-gray-100 dark:border-white/5 relative">
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                                <div>
                                    <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Mencionar Time</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quem participará?</p>
                                </div>

                                <div className="space-y-3">
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleAttendee(user.id)}
                                            className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all border ${selectedAttendees.includes(user.id) ? `bg-white dark:bg-indigo-600/10 border-indigo-500 shadow-xl dark:shadow-indigo-500/10` : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="relative">
                                                <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
                                                {selectedAttendees.includes(user.id) && (
                                                    <div className={`absolute -top-1 -right-1 w-4 h-4 ${activeTheme.bg} rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e2235]`}>
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{user.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Floating Footer Actions */}
                            <div className="pt-10 space-y-4">
                                <button onClick={handleCreateEvent} className={`w-full py-6 ${activeTheme.bg} text-white font-black rounded-[28px] shadow-2xl ${activeTheme.shadow} text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95`}>
                                    {editingEventId ? 'Atualizar Agenda' : 'Confirmar Agenda'}
                                </button>
                                <button onClick={() => { setIsCreateOpen(false); setEditingEventId(null); }} className="w-full py-4 text-[11px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-[0.2em] transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW EVENT DETAIL MODAL */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#151a21] w-full max-w-md rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className={`${activeTheme.accentBg} ${activeTheme.text} px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest`}>{selectedEvent.type}</div>
                                <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={24} /></button>
                            </div>

                            <div>
                                <div>
                                    <h3 className={`text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight ${selectedEvent.completed ? 'line-through opacity-50' : ''}`}>{selectedEvent.title}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <CalendarIcon size={14} />
                                        {new Date(selectedEvent.start).toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        {selectedEvent.completed && <span className="text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Concluído</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 dark:bg-[#1e2235] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-white dark:bg-[#151a2e] flex items-center justify-center ${activeTheme.text} shadow-sm`}><Clock size={20} /></div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Horário</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {selectedEvent.allDay ? 'Dia Inteiro' : `${new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                        </p>
                                    </div>
                                </div>
                                {selectedEvent.meetingLink && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#151a2e] flex items-center justify-center text-cyan-500 shadow-sm"><Video size={20} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{selectedEvent.platform || 'Link da Reunião'}</p>
                                            <a href={selectedEvent.meetingLink} target="_blank" rel="noreferrer" className={`text-sm font-bold ${activeTheme.text} truncate hover:underline`}>{selectedEvent.meetingLink}</a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Time Envolvido</p>
                                <div className="flex -space-x-3">
                                    {selectedEvent.attendeeIds?.map(uid => {
                                        const user = users.find(u => u.id === uid);
                                        return user ? <img key={uid} src={user.avatar} className="w-12 h-12 rounded-full border-4 border-white dark:border-[#151a2e] shadow-sm" alt="att" /> : null;
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 flex-wrap">
                                {onToggleComplete && (
                                    <button onClick={() => onToggleComplete(selectedEvent)} className={`flex-1 py-5 ${selectedEvent.completed ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'} rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all`}>
                                        {selectedEvent.completed ? 'Reabrir' : 'Concluir'}
                                    </button>
                                )}
                                {onNotifyParticipants && selectedEvent.attendeeIds && selectedEvent.attendeeIds.length > 0 && (
                                    <button onClick={() => onNotifyParticipants(selectedEvent)} className={`flex-1 py-5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-all`}>
                                        <Bell size={12} /> Notificar
                                    </button>
                                )}
                                <button onClick={() => { onDeleteEvent(selectedEvent.id); setSelectedEvent(null); }} className="flex-1 py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">Excluir</button>
                                <button onClick={() => handleEditClick(selectedEvent)} className={`flex-1 py-5 ${activeTheme.accentBg} ${activeTheme.text} border ${activeTheme.border} dark:border-opacity-20 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-all`}>
                                    <Edit2 size={12} /> Editar
                                </button>
                                <button onClick={() => setSelectedEvent(null)} className={`flex-[1.5] py-5 ${activeTheme.bg} text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl ${activeTheme.shadow} ${activeTheme.hover} transition-all`}>Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
=======
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Clock, Video, Link as LinkIcon, MapPin, Plus, ExternalLink, Trash2, X, MoreVertical, UserPlus, Users, Link2, Repeat, Check, Edit2, Target } from 'lucide-react';
import { CalendarEvent, User, SystemSettings } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  users: User[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent?: (id: string, event: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onViewTask: (taskId: string) => void;
  themeColor: string;
  settings: SystemSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, users, onAddEvent, onUpdateEvent, onDeleteEvent, onViewTask, themeColor, settings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const themeColors: any = {
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-600', shadow: 'shadow-indigo-500/20', hover: 'hover:bg-indigo-700', accent: 'text-indigo-400', accentBg: 'bg-indigo-500/10' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-600', shadow: 'shadow-emerald-500/20', hover: 'hover:bg-emerald-700', accent: 'text-emerald-400', accentBg: 'bg-emerald-500/10' },
    rose: { text: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-600', shadow: 'shadow-rose-500/20', hover: 'hover:bg-rose-700', accent: 'text-rose-400', accentBg: 'bg-rose-500/10' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600', shadow: 'shadow-blue-500/20', hover: 'hover:bg-blue-700', accent: 'text-blue-400', accentBg: 'bg-blue-500/10' },
    violet: { text: 'text-violet-600', bg: 'bg-violet-600', border: 'border-violet-600', shadow: 'shadow-violet-500/20', hover: 'hover:bg-violet-700', accent: 'text-violet-400', accentBg: 'bg-violet-500/10' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', shadow: 'shadow-orange-500/20', hover: 'hover:bg-orange-700', accent: 'text-orange-400', accentBg: 'bg-orange-500/10' },
  };

  const activeTheme = themeColors[themeColor] || themeColors.indigo;

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'meeting' | 'deadline' | 'campaign'>('meeting');
  const [newEventPlatform, setNewEventPlatform] = useState<'Google Meet' | 'Zoom' | 'Teams'>('Google Meet');
  const [newEventLink, setNewEventLink] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  
  // New Time & Recurrence State
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  // --- Navigation Handlers ---
  const prevMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  
  const upcomingEvents = useMemo(() => {
      return [...events].sort((a, b) => a.start - b.start).slice(0, 5);
  }, [events]);

  const handleDayClick = (day: number) => {
    const date = new Date(year, currentDate.getMonth(), day);
    setNewEventDate(date);
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventLink('');
    setNewEventType('meeting');
    setSelectedAttendees([]);
    setIsAllDay(false);
    setIsRecurring(false);
    setStartTime('09:00');
    setEndTime('10:00');
    setEditingEventId(null);
    setIsCreateOpen(true);
  };

  const toggleAttendee = (userId: string) => {
      setSelectedAttendees(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const handleEditClick = (event: CalendarEvent) => {
      setEditingEventId(event.id);
      setNewEventTitle(event.title);
      setNewEventDesc(event.description || '');
      setNewEventLink(event.meetingLink || '');
      setNewEventType(event.type);
      setNewEventPlatform(event.platform || 'Google Meet');
      setSelectedAttendees(event.attendeeIds || []);
      setIsAllDay(!!event.allDay);
      setIsRecurring(!!event.recurring);
      
      const start = new Date(event.start);
      const end = new Date(event.end);
      setStartTime(`${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`);
      setEndTime(`${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`);
      setNewEventDate(new Date(event.start));
      
      setSelectedEvent(null);
      setIsCreateOpen(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEventTitle || !newEventDate) return;

      const start = new Date(newEventDate);
      const [sh, sm] = startTime.split(':').map(Number);
      start.setHours(sh, sm);

      const end = new Date(newEventDate);
      const [eh, em] = endTime.split(':').map(Number);
      end.setHours(eh, em);

      const eventData: Partial<CalendarEvent> = {
          title: newEventTitle,
          description: newEventDesc,
          start: start.getTime(),
          end: end.getTime(), 
          allDay: isAllDay,
          recurring: isRecurring,
          type: newEventType,
          platform: newEventType === 'meeting' ? newEventPlatform : undefined,
          meetingLink: newEventLink,
          attendeeIds: selectedAttendees
      };

      if (editingEventId && onUpdateEvent) {
          onUpdateEvent(editingEventId, eventData);
      } else {
          onAddEvent({
              ...eventData as CalendarEvent,
              id: `evt-${Date.now()}`
          });
      }
      setIsCreateOpen(false);
      setEditingEventId(null);
  };

  const renderDays = () => {
    const days = [];
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    // Empty boxes for previous month days
    for (let i = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i > 0; i--) {
      const dayNum = prevMonthLastDay - i + 1;
      days.push(
        <div key={`prev-${dayNum}`} className="aspect-square p-2 opacity-20 bg-slate-100 dark:bg-[#1e2235]/30 rounded-2xl flex items-center justify-center text-gray-500 font-bold text-lg m-1">
          {dayNum}
        </div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, currentDate.getMonth(), d).setHours(0,0,0,0);
      const isToday = d === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && year === new Date().getFullYear();
      
      const dayEvents = events.filter(e => new Date(e.start).setHours(0,0,0,0) === dateStr);
      const hasEvents = dayEvents.length > 0;

      days.push(
        <div 
          key={d} 
          onClick={() => handleDayClick(d)}
          className={`aspect-square p-2 rounded-2xl transition-all cursor-pointer relative m-1 flex flex-col items-center justify-center group ${
            isToday ? `${activeTheme.bg} text-white shadow-xl ${activeTheme.shadow}` : 
            hasEvents ? 'bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-[#282c45]' : 'bg-slate-50 dark:bg-[#1e2235] hover:bg-slate-100 dark:hover:bg-[#282c45]'
          }`}
        >
          <span className={`text-xl font-bold ${hasEvents && !isToday ? 'text-gray-900 dark:text-white' : isToday ? 'text-white' : 'text-gray-400'}`}>{d}</span>
          
          {hasEvents && (
            <div className="mt-2 flex -space-x-1.5 overflow-hidden">
              {dayEvents.flatMap(e => e.attendeeIds || []).slice(0, 3).map((uid, idx) => {
                  const user = users.find(u => u.id === uid);
                  return user ? <img key={idx} src={user.avatar} className="w-5 h-5 rounded-full border border-white dark:border-[#1e2235]" alt="att" /> : null;
              })}
            </div>
          )}

          {hasEvents && !isToday && (
              <div className="mt-1 flex gap-1 justify-center">
                  <div className={`w-2 h-2 rounded-full ${activeTheme.bg}`}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-gray-600"></div>
              </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white dark:bg-[#151a21] rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 dark:border-[#2a303c]/30 transition-colors">
      
      {/* Calendar Grid Area */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter capitalize">
                  {monthName} <span className="text-gray-400 dark:text-gray-500">{year}</span>
              </h2>
              <button className={`${activeTheme.text} hover:opacity-80 transition-colors`}><ChevronDown size={24} /></button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-3 bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-gray-600 dark:text-white transition-all"><ChevronLeft size={24}/></button>
            <button onClick={nextMonth} className="p-3 bg-slate-100 dark:bg-[#1e2235] hover:bg-slate-200 dark:hover:bg-white/10 rounded-2xl text-gray-600 dark:text-white transition-all"><ChevronRight size={24}/></button>
            <button onClick={() => handleDayClick(new Date().getDate())} className={`ml-4 ${activeTheme.bg} ${activeTheme.hover} text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg ${activeTheme.shadow}`}>
                <UserPlus size={20} /> Novo Evento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
            <div key={day} className="text-center text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest py-4">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {renderDays()}
        </div>
      </div>

      {/* Sidebar Event List */}
      <div className="w-full lg:w-[400px] bg-slate-50 dark:bg-[#0b0e11] p-10 flex flex-col border-l border-gray-100 dark:border-white/5 overflow-y-auto custom-scrollbar">
          <div className="mb-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Lista de Eventos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie seu cronograma de produção</p>
          </div>

          <div className="space-y-6">
              {upcomingEvents.length === 0 ? (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4 text-gray-400 dark:text-gray-500">
                      <CalendarIcon size={48} />
                      <p className="text-xs font-black uppercase tracking-widest">Sem eventos próximos</p>
                  </div>
              ) : (
                upcomingEvents.map(event => (
                  <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white dark:bg-[#151a21] rounded-3xl p-6 border border-gray-200 dark:border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group relative shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-black ${activeTheme.text} uppercase tracking-widest`}>{new Date(event.start).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><MoreVertical size={16}/></button>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white mb-4 leading-tight">{event.title}</h4>
                      
                      <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                              <Clock size={14} className={activeTheme.text} />
                              {event.allDay ? 'Dia Inteiro' : `${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </div>
                      </div>

                      <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${activeTheme.bg} w-2/3`}></div>
                      </div>
                  </div>
                ))
              )}
          </div>
      </div>

      {/* CREATE/EDIT EVENT MODAL */}
      {isCreateOpen && newEventDate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#151a21] w-full max-w-5xl rounded-[40px] shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-[780px] relative">
                  
                  {/* Left Panel: Form Content */}
                  <div className="flex-[1.6] p-10 overflow-y-auto custom-scrollbar space-y-8 bg-white dark:bg-[#151a21]">
                      <div>
                          <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{editingEventId ? 'Editar Item da Agenda' : 'Novo Item na Agenda'}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Planeje sua produção sincronizada com o time.</p>
                      </div>

                      <div className="space-y-6">
                          <div>
                              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Título do Evento</label>
                              <input 
                                type="text" 
                                autoFocus
                                required
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl focus:ring-1 focus:ring-indigo-500 outline-none font-bold placeholder:text-gray-300 dark:placeholder:text-gray-800"
                                placeholder="ex: Revisão Criativa" 
                              />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Tipo</label>
                                  <div className="relative">
                                      <select 
                                        value={newEventType}
                                        onChange={(e) => setNewEventType(e.target.value as any)}
                                        className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl font-bold outline-none appearance-none"
                                      >
                                          <option value="meeting">Reunião</option>
                                          <option value="deadline">Prazo</option>
                                          <option value="campaign">Campanha</option>
                                      </select>
                                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Plataforma (Opcional)</label>
                                  <div className="relative">
                                      <select 
                                        value={newEventPlatform}
                                        onChange={(e) => setNewEventPlatform(e.target.value as any)}
                                        className="w-full p-5 bg-slate-50 dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl font-bold outline-none appearance-none"
                                      >
                                          <option value="Google Meet">Google Meet</option>
                                          <option value="Zoom">Zoom</option>
                                          <option value="Teams">Teams</option>
                                      </select>
                                      <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                              </div>
                          </div>

                          {/* Time & Options Area */}
                          <div className="bg-slate-50 dark:bg-[#151a2e]/50 p-6 rounded-3xl border border-gray-200 dark:border-white/5 space-y-6">
                              <div className="flex flex-wrap items-center gap-6">
                                  <button 
                                    type="button"
                                    onClick={() => setIsAllDay(!isAllDay)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAllDay ? `${activeTheme.bg} text-white shadow-lg ${activeTheme.shadow}` : 'bg-white dark:bg-[#0b0e11] text-gray-500 border border-gray-200 dark:border-white/5'}`}
                                  >
                                      {isAllDay && <Check size={14}/>} Dia Todo
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecurring ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'bg-white dark:bg-[#0b0e11] text-gray-500 border border-gray-200 dark:border-white/5'}`}
                                  >
                                      {isRecurring ? <Repeat size={14}/> : <Repeat size={14} className="opacity-30"/>} Recorrente
                                  </button>
                              </div>

                              {!isAllDay && (
                                  <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block">Início</label>
                                          <input 
                                            type="time" 
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full p-4 bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-mono text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase mb-2 block">Fim</label>
                                          <input 
                                            type="time" 
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full p-4 bg-white dark:bg-[#0b0e11] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-mono text-sm outline-none focus:ring-1 focus:ring-indigo-500" 
                                          />
                                      </div>
                                  </div>
                              )}
                          </div>

                          <div>
                              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Link da Reunião</label>
                              <div className="relative">
                                  <Link2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    type="text"
                                    value={newEventLink}
                                    onChange={(e) => setNewEventLink(e.target.value)}
                                    className="w-full p-5 pl-14 bg-slate-50 dark:bg-[#151a2e] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-3xl focus:ring-1 focus:ring-indigo-500 outline-none text-sm font-medium"
                                    placeholder="https://meet.google.com/..." 
                                  />
                              </div>
                          </div>

                          <div>
                              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Descrição</label>
                              <textarea 
                                 value={newEventDesc}
                                 onChange={(e) => setNewEventDesc(e.target.value)}
                                 className="w-full p-6 bg-slate-50 dark:bg-[#151a2e] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-white rounded-[32px] text-sm resize-none h-32 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-800"
                                 placeholder="Adicione notas para o time..."
                              />
                          </div>
                      </div>
                  </div>

                  {/* Right Panel: Side Actions & Team */}
                  <div className="flex-1 bg-slate-50 dark:bg-[#0b0e11] p-10 flex flex-col border-l border-gray-100 dark:border-white/5 relative">
                      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                          <div>
                              <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Mencionar Time</h4>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quem participará?</p>
                          </div>
                          
                          <div className="space-y-3">
                              {users.map(user => (
                                  <div 
                                      key={user.id} 
                                      onClick={() => toggleAttendee(user.id)}
                                      className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all border ${selectedAttendees.includes(user.id) ? `bg-white dark:bg-indigo-600/10 border-indigo-500 shadow-xl dark:shadow-indigo-500/10` : 'bg-transparent border-transparent hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                  >
                                      <div className="relative">
                                        <img src={user.avatar} className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
                                        {selectedAttendees.includes(user.id) && (
                                            <div className={`absolute -top-1 -right-1 w-4 h-4 ${activeTheme.bg} rounded-full flex items-center justify-center border-2 border-white dark:border-[#1e2235]`}>
                                                <Check size={10} className="text-white" />
                                            </div>
                                        )}
                                      </div>
                                      <div className="flex-1 truncate">
                                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider">{user.role}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Floating Footer Actions */}
                      <div className="pt-10 space-y-4">
                          <button onClick={handleCreateEvent} className={`w-full py-6 ${activeTheme.bg} text-white font-black rounded-[28px] shadow-2xl ${activeTheme.shadow} text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95`}>
                              {editingEventId ? 'Atualizar Agenda' : 'Confirmar Agenda'}
                          </button>
                          <button onClick={() => { setIsCreateOpen(false); setEditingEventId(null); }} className="w-full py-4 text-[11px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-[0.2em] transition-colors">
                              Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* VIEW EVENT DETAIL MODAL */}
      {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-[#151a21] w-full max-w-md rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                  <div className="p-8 space-y-8">
                      <div className="flex justify-between items-start">
                          <div className={`${activeTheme.accentBg} ${activeTheme.text} px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest`}>{selectedEvent.type}</div>
                          <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><X size={24}/></button>
                      </div>
                      
                      <div>
                          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{selectedEvent.title}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                              <CalendarIcon size={14} />
                              {new Date(selectedEvent.start).toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 dark:bg-[#1e2235] p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-[#151a2e] flex items-center justify-center ${activeTheme.text} shadow-sm`}><Clock size={20}/></div>
                              <div>
                                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Horário</p>
                                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {selectedEvent.allDay ? 'Dia Inteiro' : `${new Date(selectedEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedEvent.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                  </p>
                              </div>
                          </div>
                          {selectedEvent.meetingLink && (
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#151a2e] flex items-center justify-center text-cyan-500 shadow-sm"><Video size={20}/></div>
                                  <div>
                                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{selectedEvent.platform || 'Link da Reunião'}</p>
                                      <a href={selectedEvent.meetingLink} target="_blank" rel="noreferrer" className={`text-sm font-bold ${activeTheme.text} truncate hover:underline`}>{selectedEvent.meetingLink}</a>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Time Envolvido</p>
                          <div className="flex -space-x-3">
                              {selectedEvent.attendeeIds?.map(uid => {
                                  const user = users.find(u => u.id === uid);
                                  return user ? <img key={uid} src={user.avatar} className="w-12 h-12 rounded-full border-4 border-white dark:border-[#151a2e] shadow-sm" alt="att" /> : null;
                              })}
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button onClick={() => { onDeleteEvent(selectedEvent.id); setSelectedEvent(null); }} className="flex-1 py-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all">Excluir</button>
                          <button onClick={() => handleEditClick(selectedEvent)} className={`flex-1 py-5 ${activeTheme.accentBg} ${activeTheme.text} border ${activeTheme.border} dark:border-opacity-20 rounded-[24px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-80 transition-all`}>
                             <Edit2 size={12}/> Editar
                          </button>
                          <button onClick={() => setSelectedEvent(null)} className={`flex-[1.5] py-5 ${activeTheme.bg} text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl ${activeTheme.shadow} ${activeTheme.hover} transition-all`}>Fechar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
>>>>>>> fe06aaa8afaf67824d6d0840f5dbca71c1cfdce6
};
