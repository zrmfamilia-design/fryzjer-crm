import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, Navigate } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setMonth, setYear } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSupabaseData } from '../hooks/useSupabaseData';
import VisitModal from '../components/VisitModal';
import { ensureDate } from '../utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';

const locales = { 'pl': pl };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CustomToolbar = (props: any) => {
    const { date, onNavigate, onView, view } = props;

    const navigate = (action: string) => {
        onNavigate(action);
    };

    const jumpToMonth = (m: number) => {
        const nextDate = setMonth(date, m);
        onNavigate(Navigate.DATE, nextDate);
    };

    const jumpToYear = (y: number) => {
        const nextDate = setYear(date, y);
        onNavigate(Navigate.DATE, nextDate);
    };

    const months = [
        "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
        "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
    ];

    const currentYear = date.getFullYear();
    const years = [2025, 2026, 2027];

    return (
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4 bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                <button
                    onClick={() => navigate(Navigate.PREVIOUS)}
                    className="flex-none p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors flex items-center justify-center text-gray-600 shadow-sm"
                    title={view === Views.MONTH ? "Poprzedni miesiąc" : view === Views.WEEK ? "Poprzedni tydzień" : "Poprzedni dzień"}
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => navigate(Navigate.TODAY)}
                    className="flex-1 lg:flex-none px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-xs sm:text-sm font-bold shadow-sm whitespace-nowrap"
                >
                    Dzisiaj
                </button>
                <button
                    onClick={() => navigate(Navigate.NEXT)}
                    className="flex-none p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors flex items-center justify-center text-gray-600 shadow-sm"
                    title={view === Views.MONTH ? "Następny miesiąc" : view === Views.WEEK ? "Następny tydzień" : "Następny dzień"}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                    value={date.getMonth()}
                    onChange={(e) => jumpToMonth(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                    value={currentYear}
                    onChange={(e) => jumpToYear(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-700"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex bg-gray-200 p-1 rounded-xl w-full sm:w-auto">
                {[
                    { id: Views.MONTH, label: 'Miesiąc' },
                    { id: Views.WEEK, label: 'Tydzień' },
                    { id: Views.DAY, label: 'Dzień' }
                ].map(v => (
                    <button
                        key={v.id}
                        onClick={() => onView(v.id)}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-tight transition-all ${view === v.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {v.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CalendarPage: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialDate, setInitialDate] = useState<Date>(new Date());
    const [editingVisitId, setEditingVisitId] = useState<number | undefined>(undefined);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView, setCurrentView] = useState<View>(Views.MONTH);

    const { data: visits } = useSupabaseData<any>('visits');
    const { data: clients } = useSupabaseData<any>('clients');
    const { data: services } = useSupabaseData<any>('services');

    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        if (!visits || !clients || !services) return;

        const mappedEvents = visits.map(visit => {
            const client = clients.find(c => c.id === visit.client_id || c.id === visit.clientId);
            const serviceIds = visit.service_ids || visit.serviceIds || [];
            const primaryServiceId = serviceIds[0];
            const service = services.find(s => s.id === primaryServiceId);

            if (!service) return null;

            const visitDate = ensureDate(visit.date);
            const endDate = new Date(visitDate.getTime() + service.duration * 60000);

            let color = service.color || '#a855f7'; // fallback purple
            if (!service.color) {
                if (service.name === 'Dekoloryzacja') color = '#ef4444';
                else if (service.name === 'Koloryzacja') color = '#7c3aed';
                else if (service.name === 'Strzyżenie') color = '#3b82f6';
                else if (service.name === 'Kuracja') color = '#10b981';
                else if (service.name === 'Inne') color = '#f59e0b';
            }

            return {
                id: visit.id,
                title: `${service.name} - ${client?.name || '??'}`,
                start: visitDate,
                end: endDate,
                resource: { visit, client, service },
                color: color
            };
        }).filter(Boolean);

        setEvents(mappedEvents);
    }, [visits, clients, services]);

    const eventStyleGetter = (event: any) => ({
        style: {
            backgroundColor: event.color,
            borderRadius: '6px',
            opacity: 0.95,
            color: 'white',
            border: 'none',
            display: 'block',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
    });

    const handleSelectSlot = useCallback((slotInfo: any) => {
        setInitialDate(slotInfo.start);
        setEditingVisitId(undefined);
        setIsModalOpen(true);
    }, []);

    const handleSelectEvent = useCallback((event: any) => {
        setEditingVisitId(event.id);
        setInitialDate(event.start);
        setIsModalOpen(true);
    }, []);

    return (
        <div className="h-full flex flex-col space-y-4 p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
                        <CalendarIcon className="text-primary" /> Kalendarz Wizyt
                    </h1>
                    <p className="text-gray-400 text-xs sm:text-sm">Zarządzaj rezerwacjami i czasem pracy.</p>
                </div>
                <button
                    onClick={() => { setEditingVisitId(undefined); setIsModalOpen(true); }}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all font-black flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"
                >
                    <Plus size={20} /> Nowa Wizyta
                </button>
            </div>

            <div className="flex-1 bg-white p-4 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 text-gray-800 flex flex-col min-h-[600px] h-full">
                <style>{`
                    .rbc-calendar { font-family: 'Inter', sans-serif; }
                    .rbc-header { padding: 8px sm:12px; font-weight: 700; color: #6b7280; text-transform: uppercase; font-size: 10px sm:11px; letter-spacing: 0.05em; border-bottom: 2px solid #f3f4f6; }
                    .rbc-month-view { border: none !important; }
                    .rbc-day-bg { border-left: 1px solid #f3f4f6 !important; transition: background 0.2s; }
                    .rbc-day-bg:hover { background-color: #f9fafb; cursor: pointer; }
                    .rbc-month-row { border-bottom: 1px solid #f3f4f6 !important; }
                    .rbc-today { background-color: #f5f3ff !important; }
                    .rbc-off-range-bg { background-color: #fafafa !important; color: #d1d5db; }
                    .rbc-event { transition: transform 0.1s; border-radius: 8px !important; }
                    .rbc-event:hover { transform: scale(1.02); z-index: 50; }
                    .rbc-time-view { border: none; border-top: 1px solid #f3f4f6; flex: 1; display: flex; flex-direction: column; min-h-0; }
                    .rbc-time-header { border-bottom: 2px solid #f3f4f6; }
                    .rbc-time-content { border-top: none; overflow-y: auto !important; }
                    .rbc-timeslot-group { border-bottom: 1px solid #f3f4f6; min-height: 50px; }
                    .rbc-selected-cell { background-color: #e0e7ff !important; }
                    .rbc-show-more { font-size: 9px; font-weight: 900; color: #7c3aed; background: #f5f3ff; border-radius: 4px; padding: 2px 4px; }
                    @media (max-width: 640px) {
                        .rbc-header { padding: 4px; font-size: 9px; }
                        .rbc-event-content { font-size: 9px; }
                        .rbc-button-link { font-size: 10px; }
                    }
                `}</style>
                <Calendar
                    localizer={localizer}
                    events={events}
                    date={currentDate}
                    view={currentView}
                    onNavigate={(newDate) => setCurrentDate(newDate)}
                    onView={(newView) => setCurrentView(newView)}
                    style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}
                    culture='pl'
                    eventPropGetter={eventStyleGetter}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    selectable
                    components={{
                        toolbar: CustomToolbar,
                    }}
                    messages={{
                        noEventsInRange: "Brak wizyt w tym okresie.",
                        allDay: "Cały dzień",
                    }}
                />
            </div>

            <VisitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialDate={initialDate}
                visitId={editingVisitId}
            />
        </div>
    );
};

export default CalendarPage;
