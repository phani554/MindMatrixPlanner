
import React, { useState, useMemo } from 'react';
import { Task, Project, Resource, CalendarEvent } from '../types';
import { Modal } from './Modal'; 
import { PlusIcon } from './icons';

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
  resources: Resource[];
  events: CalendarEvent[];
  onAddEvent: (date?: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
}

interface DayRenderData {
  day: number;
  month: number; // 0-indexed
  year: number;
  date: Date; // Full date object for easier manipulation
  isCurrentMonth: boolean;
  isToday: boolean;
  tasksOnDay: Task[];
  eventsOnDay: CalendarEvent[];
}

type CalendarViewMode = 'month' | 'week';

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, projects, resources, events, onAddEvent, onEditEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayItems, setSelectedDayItems] = useState<{tasks: Task[], events: CalendarEvent[]}>({tasks: [], events: []});
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const currentYear = currentDate.getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear - 5 + i);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

  const getWeekDays = (date: Date): DayRenderData[] => {
    const week: DayRenderData[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Get Sunday
    startOfWeek.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
        const dateKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
        week.push({
            day: dayDate.getDate(),
            month: dayDate.getMonth(),
            year: dayDate.getFullYear(),
            date: dayDate,
            isCurrentMonth: dayDate.getMonth() === currentDate.getMonth(), // Highlight if in current displayed month context for week view
            isToday: dayDate.getTime() === today.getTime(),
            tasksOnDay: tasks.filter(t => t.dueDate === dateKey),
            eventsOnDay: events.filter(e => e.date === dateKey)
        });
    }
    return week;
  };
  
  const weeklyCalendarGrid = useMemo(() => getWeekDays(currentDate), [currentDate, tasks, events]);


  const monthlyCalendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month); // 0 (Sun) to 6 (Sat)
    const today = new Date();
    today.setHours(0,0,0,0);

    const grid: DayRenderData[] = [];

    // Days from previous month
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const numDaysPrevMonth = daysInMonth(prevYear, prevMonth);
    for (let i = 0; i < firstDay; i++) { // Iterate to fill up cells before the first day of current month
      const day = numDaysPrevMonth - firstDay + 1 + i;
      const dayDate = new Date(prevYear, prevMonth, day);
      dayDate.setHours(0,0,0,0);
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      grid.push({ day, month: prevMonth, year: prevYear, date: dayDate, isCurrentMonth: false, isToday: false, tasksOnDay: tasks.filter(t => t.dueDate === dateKey), eventsOnDay: events.filter(e => e.date === dateKey) });
    }

    // Days of current month
    for (let day = 1; day <= numDays; day++) {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0,0,0,0);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      grid.push({ day, month, year, date: dayDate, isCurrentMonth: true, isToday: dayDate.getTime() === today.getTime(), tasksOnDay: tasks.filter(t => t.dueDate === dateKey), eventsOnDay: events.filter(e => e.date === dateKey) });
    }

    // Days from next month
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const cellsRendered = grid.length;
    const totalCells = cellsRendered <= 35 ? 35 : 42; // Ensure 5 or 6 rows
    
    for (let day = 1; grid.length < totalCells; day++) {
      const dayDate = new Date(nextYear, nextMonth, day);
      dayDate.setHours(0,0,0,0);
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      grid.push({ day, month: nextMonth, year: nextYear, date: dayDate, isCurrentMonth: false, isToday: false, tasksOnDay: tasks.filter(t => t.dueDate === dateKey), eventsOnDay: events.filter(e => e.date === dateKey) });
    }
    return grid;
  }, [currentDate, tasks, events]);


  const changeDate = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') newDate.setMonth(prev.getMonth() + offset, 1);
      else newDate.setDate(prev.getDate() + (offset * 7)); // offset is +/- 1 week
      return newDate;
    });
  };
  
  const handlePullFromGoogleCalendar = () => {
    console.log("Attempting to pull events from Google Calendar...");
    // Actual Google Calendar API integration would go here.
    // This would involve OAuth2, fetching events, and then likely calling onAddEvent or a similar function
    // to add them to the local state, ensuring no duplicates if pulled multiple times.
    // For now, it's just a placeholder.
    alert("Google Calendar integration is a placeholder. Check console for log.");
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    setCurrentDate(prev => { const newDate = new Date(prev); newDate.setFullYear(year); return newDate; });
  };
  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(event.target.value);
    setCurrentDate(prev => { const newDate = new Date(prev); newDate.setMonth(month,1); return newDate; });
};

  const handleDayClick = (dayData: DayRenderData) => {
    if (dayData.tasksOnDay.length > 0 || dayData.eventsOnDay.length > 0) {
      setSelectedDayItems({ tasks: dayData.tasksOnDay, events: dayData.eventsOnDay });
      setSelectedDateForModal(dayData.date);
      setIsDayModalOpen(true);
    }
  };
  
  const getProjectName = (projectId?: string) => projects.find(p => p.id === projectId)?.customerName || 'N/A';
  const getResourceName = (resourceId?: string) => resources.find(r => r.id === resourceId)?.name || 'N/A';

  const EventColorDot: React.FC<{ color?: string }> = ({ color }) => {
    const eventColor = color || 'bg-purple-500'; 
    if (color && (color.startsWith('bg-') || color.startsWith('text-'))) {
        return <span className={`w-2 h-2 rounded-full inline-block mr-1 ${color}`}></span>;
    }
    return <span className={`w-2 h-2 rounded-full inline-block mr-1`} style={{ backgroundColor: color || '#8B5CF6' }}></span>;
  };

  const renderDayCellContent = (dayData: DayRenderData, isWeeklyView: boolean) => {
    const maxItems = isWeeklyView ? 4 : 2; // Show more items in weekly view cells
    const eventsToShow = dayData.eventsOnDay.slice(0, isWeeklyView ? 2 : 1);
    const tasksToShow = dayData.tasksOnDay.slice(0, maxItems - eventsToShow.length);
    const remainingItems = (dayData.tasksOnDay.length + dayData.eventsOnDay.length) - (eventsToShow.length + tasksToShow.length);

    return (
        <>
            <span className={`text-xs ${dayData.isCurrentMonth || isWeeklyView ? 'text-slate-300' : 'text-slate-600'}`}>{dayData.day}</span>
            <div className={`mt-1 space-y-0.5 text-[10px] sm:text-xs ${isWeeklyView ? 'max-h-28 overflow-y-auto custom-scrollbar-xs pr-0.5' : ''}`}>
              {eventsToShow.map(event => (
                <div key={`event-${event.id}`} className="p-0.5 sm:p-1 bg-purple-500/70 text-white rounded truncate text-xs" title={`${event.title}`}>
                  <EventColorDot color={event.color} /> {event.title}
                </div>
              ))}
              {tasksToShow.map(task => (
                <div key={`task-${task.id}`} className="p-0.5 sm:p-1 bg-[#F29C2A]/70 text-slate-900 rounded truncate text-xs" title={`${task.title} (${getProjectName(task.projectId)})`}>
                  {task.title}
                </div>
              ))}
              {remainingItems > 0 && (
                <div className="p-0.5 sm:p-1 bg-slate-500/70 text-slate-100 rounded text-center text-xs">
                  + {remainingItems} more
                </div>
              )}
            </div>
        </>
    );
  }

  return (
    <div className="bg-slate-800/60 p-4 sm:p-6 rounded-xl shadow-xl backdrop-blur-sm text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-1 sm:space-x-2">
            <button onClick={() => changeDate(-1)} className="px-3 py-2 bg-slate-700 hover:bg-[#F29C2A] hover:text-slate-900 rounded-md transition-colors">&lt; Prev</button>
            <select value={currentDate.getMonth()} onChange={handleMonthChange} className="bg-slate-700 text-slate-100 p-2 rounded-md focus:ring-2 focus:ring-[#F29C2A] focus:border-[#F29C2A] text-sm sm:text-base">
                {Array.from({length: 12}, (_, i) => i).map(monthIdx => (
                    <option key={monthIdx} value={monthIdx}>{new Date(0, monthIdx).toLocaleString('default', { month: 'long' })}</option>
                ))}
            </select>
            <select value={currentDate.getFullYear()} onChange={handleYearChange} className="bg-slate-700 text-slate-100 p-2 rounded-md focus:ring-2 focus:ring-[#F29C2A] focus:border-[#F29C2A] text-sm sm:text-base">
                {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
            <button onClick={() => changeDate(1)} className="px-3 py-2 bg-slate-700 hover:bg-[#F29C2A] hover:text-slate-900 rounded-md transition-colors">Next &gt;</button>
        </div>
        <div className="flex items-center space-x-2">
            <div className="flex rounded-md bg-slate-700 p-0.5">
                <button onClick={() => setViewMode('month')} className={`px-2 py-1 text-xs rounded ${viewMode === 'month' ? 'bg-[#F29C2A] text-slate-900' : 'text-slate-300 hover:bg-slate-600'}`}>Month</button>
                <button onClick={() => setViewMode('week')} className={`px-2 py-1 text-xs rounded ${viewMode === 'week' ? 'bg-[#F29C2A] text-slate-900' : 'text-slate-300 hover:bg-slate-600'}`}>Week</button>
            </div>
            <button 
              onClick={handlePullFromGoogleCalendar}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 text-sm"
              title="Pull events from Google Calendar (Placeholder)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Pull GCal</span>
            </button>
            <button 
                onClick={() => onAddEvent(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md transition-all duration-200 flex items-center space-x-2 text-sm"
            >
              <PlusIcon className="w-4 h-4"/> <span>Add Event</span>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-xs font-semibold text-slate-400 bg-slate-700/50 rounded-t-md">{day}</div>
        ))}
        {(viewMode === 'month' ? monthlyCalendarGrid : weeklyCalendarGrid).map((dayData, i) => (
          <div 
            key={`${dayData.year}-${dayData.month}-${dayData.day}-${i}`} 
            className={`p-2 border border-slate-700 min-h-[80px] sm:min-h-[100px] rounded-md transition-colors text-left overflow-hidden
                        ${(dayData.isCurrentMonth && viewMode==='month') || viewMode === 'week' ? 'bg-slate-700/40' : 'bg-slate-700/20 text-slate-500'}
                        ${dayData.isToday ? 'ring-2 ring-[#F29C2A] bg-slate-600/50' : ''}
                        ${(dayData.tasksOnDay.length > 0 || dayData.eventsOnDay.length > 0) ? 'cursor-pointer hover:bg-slate-600/70' : ''}
                      `}
            onClick={() => handleDayClick(dayData)}
            onDoubleClick={() => onAddEvent(`${dayData.year}-${String(dayData.month + 1).padStart(2,'0')}-${String(dayData.day).padStart(2,'0')}`)}
            role="button"
            tabIndex={(dayData.tasksOnDay.length > 0 || dayData.eventsOnDay.length > 0) ? 0 : -1}
            aria-label={`Day ${dayData.day}, ${dayData.tasksOnDay.length} tasks, ${dayData.eventsOnDay.length} events`}
          >
            {renderDayCellContent(dayData, viewMode === 'week')}
          </div>
        ))}
      </div>
      {isDayModalOpen && selectedDateForModal && (
        <Modal isOpen={isDayModalOpen} onClose={() => setIsDayModalOpen(false)} title={`Details for ${selectedDateForModal.toLocaleDateString()}`}>
            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar-xs">
                {selectedDayItems.events.length > 0 && (
                    <>
                        <h4 className="font-semibold text-purple-400 mt-2 border-b border-slate-600 pb-1">Events</h4>
                        {selectedDayItems.events.map(event => (
                            <div key={event.id} className="p-3 bg-slate-700 rounded-md shadow">
                                <div className="flex justify-between items-start">
                                    <h5 className="font-semibold text-purple-300"><EventColorDot color={event.color} />{event.title}</h5>
                                    <div className="flex space-x-1">
                                        <button onClick={() => {onEditEvent(event); setIsDayModalOpen(false);}} className="text-xs text-slate-400 hover:text-[#F29C2A]">Edit</button>
                                        <button onClick={() => {onDeleteEvent(event.id); setIsDayModalOpen(false);setSelectedDayItems(prev => ({...prev, events: prev.events.filter(e => e.id !== event.id)} ));}} className="text-xs text-slate-400 hover:text-red-500">Del</button>
                                    </div>
                                </div>
                                {(event.startTime || event.endTime) && (
                                    <p className="text-xs text-slate-500">
                                        {event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}
                                    </p>
                                )}
                                {event.description && <p className="text-xs text-slate-400 mt-1">{event.description}</p>}
                            </div>
                        ))}
                    </>
                )}
                {selectedDayItems.tasks.length > 0 && (
                     <>
                        <h4 className="font-semibold text-sky-400 mt-3 border-b border-slate-600 pb-1">Tasks Due</h4>
                        {selectedDayItems.tasks.map(task => (
                            <div key={task.id} className="p-3 bg-slate-700 rounded-md shadow">
                                <h5 className="font-semibold text-[#F29C2A]">{task.title}</h5>
                                <p className="text-xs text-sky-400">Project: {getProjectName(task.projectId)}</p>
                                <p className="text-xs text-slate-400">Status: {task.status} | Priority: {task.priority}</p>
                                {task.assignedResourceId && <p className="text-xs text-slate-400">Assigned: {getResourceName(task.assignedResourceId)}</p>}
                                <p className="text-xs text-slate-500 mt-1">{task.description || "No description."}</p>
                            </div>
                        ))}
                    </>
                )}
                 {(selectedDayItems.events.length === 0 && selectedDayItems.tasks.length === 0) && (
                    <p className="text-slate-500 text-center py-4">No events or tasks for this day.</p>
                 )}
            </div>
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={() => {onAddEvent(selectedDateForModal.toISOString().split('T')[0]); setIsDayModalOpen(false);}}
                    className="text-xs px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors"
                >
                    Add New Event for this Day
                </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarView;
