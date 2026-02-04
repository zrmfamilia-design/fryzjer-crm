import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, Navigate } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, setMonth, setYear } from 'date-fns';
import { pl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useSupabaseData } from '../hooks/useSupabaseData';
import VisitModal from '../components/VisitModal';
import { ensureDate } from '../utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate(Navigate.PREVIOUS)}
                    className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-sm font-medium text-gray-600 shadow-sm"
                >
                    <ChevronLeft size={16} /> Poprzedni Miesiąc
                </button>
                <button
                    onClick={() => navigate(Navigate.TODAY)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm font-bold shadow-sm"
                >
                    Obecny Miesiąc
                </button>
                <button
                    onClick={() => navigate(Navigate.NEXT)}
                    className="p-2 hover:bg-white rounded-lg border border-gray-200 transition-colors flex items-center gap-1 text-sm font-medium text-gray-600 shadow-sm"
                >
                    Następny Miesiąc <ChevronRight size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={date.getMonth()}
                    onChange={(e) => jumpToMonth(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select
                    value={currentYear}
                    onChange={(e) => jumpToYear(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="flex bg-gray-200 p-1 rounded-lg">
                {[
                    { id: Views.MONTH, label: 'Miesiąc' },
                    { id: Views.WEEK, label: 'Tydzień' },
                    { id: Views.DAY, label: 'Dzień' }
                ].map(v => (
                    <button
                        key={v.id}
                        onClick={() => onView(v.id)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${view === v.id ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
        <div className="h-full flex flex-col space-y-4 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <CalendarIcon className="text-primary" /> Kalendarz Wizyt
                    </h1>
                    <p className="text-gray-400 text-sm">Zarządzaj rezerwacjami i czasem pracy.</p>
                </div>
                <button
                    onClick={() => { setEditingVisitId(undefined); setIsModalOpen(true); }}
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all font-bold flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span>+ Nowa Wizyta</span>
                </button>
            </div>

            <div className="flex-1 bg-white p-4 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 text-gray-800 flex flex-col min-h-0">
                <style>{`
                    .rbc-calendar { font-family: 'Inter', sans-serif; }
                    .rbc-header { padding: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; border-bottom: 2px solid #f3f4f6; }
                    .rbc-month-view { border: none !important; }
                    .rbc-day-bg { border-left: 1px solid #f3f4f6 !important; transition: background 0.2s; }
                    .rbc-day-bg:hover { background-color: #f9fafb; cursor: pointer; }
                    .rbc-month-row { border-bottom: 1px solid #f3f4f6 !important; }
                    .rbc-today { background-color: #f5f3ff !important; }
                    .rbc-off-range-bg { background-color: #fafafa !important; color: #d1d5db; }
                    .rbc-event { transition: transform 0.1s; }
                    .rbc-event:hover { transform: scale(1.02); z-index: 50; }
                    .rbc-time-view { border: none; border-top: 1px solid #f3f4f6; flex: 1; display: flex; flex-direction: column; min-h-0; }
                    .rbc-time-header { border-bottom: 2px solid #f3f4f6; }
                    .rbc-time-content { border-top: none; overflow-y: auto !important; }
                    .rbc-timeslot-group { border-bottom: 1px solid #f3f4f6; min-height: 50px; }
                    .rbc-selected-cell { background-color: #e0e7ff !important; }
                `}</style>
                <Calendar
                    localizer={localizer}
                    events={events}
                    date={currentDate}
                    view={currentView}
                    onNavigate={(newDate) => setCurrentDate(newDate)}
                    onView={(newView) => setCurrentView(newView)}
                    style={{ height: '100%' }}
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
