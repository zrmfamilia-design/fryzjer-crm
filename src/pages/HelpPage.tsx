import React from 'react';
import {
    Calendar,
    Users,
    Package,
    DollarSign,
    BarChart3,
    ShieldCheck,
    Info,
    Scissors,
    ArrowRight,
    TrendingDown,
    Download,
    RefreshCcw,
    Camera,
    FileText
} from 'lucide-react';

const HelpPage: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto p-8 space-y-12 pb-20 scrollbar-hide">
            {/* Hero Section */}
            <div className="bg-nav-bg rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-black mb-4">Witaj w S.Mazurkiewicz CRM</h1>
                    <p className="text-gray-300 text-lg font-medium leading-relaxed">
                        Ten system został stworzony, abyś mogła skupić się na swojej pasji, podczas gdy my zajmiemy się logistyką, finansami i magazynem.
                    </p>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Calendar */}
                <HelpCard
                    icon={<Calendar className="text-primary" />}
                    title="Kalendarz i Wizyty"
                    badge="Centrum Dowodzenia"
                >
                    <ul className="space-y-4">
                        <FeatureItem
                            icon={<Scissors size={14} />}
                            text="Kliknij w godzinę, aby umówić wizytę."
                        />
                        <FeatureItem
                            icon={<Info size={14} className="text-purple-500" />}
                            text={<><b>Karta Techniczna</b>: Pola na receptury (fioletowe) zapisują się na stałe w profilu klientki.</>}
                        />
                        <FeatureItem
                            icon={<Package size={14} />}
                            text="System automatycznie wylicza koszt materiałów na podstawie gramatury."
                        />
                        <FeatureItem
                            icon={<Camera size={14} />}
                            text="Możliwość dodania do 4 zdjęć dokumentujących efekt."
                        />
                    </ul>
                </HelpCard>

                {/* 2. Clients */}
                <HelpCard
                    icon={<Users className="text-blue-500" />}
                    title="Baza Klientów"
                    badge="Relacje"
                >
                    <ul className="space-y-4">
                        <FeatureItem
                            icon={<ArrowRight size={14} />}
                            text="Pełna historia wizyt, wydatków i użytych receptur."
                        />
                        <FeatureItem
                            icon={<Download size={14} />}
                            text="Importuj bazę z pliku CSV (Excel) jednym kliknięciem."
                        />
                        <FeatureItem
                            icon={<DollarSign size={14} className="text-green-500" />}
                            text={<><b>LTV</b>: Widzisz łączną sumę, jaką każda osoba zostawiła w Twoim salonie.</>}
                        />
                    </ul>
                </HelpCard>

                {/* 3. Inventory */}
                <HelpCard
                    icon={<Package className="text-orange-500" />}
                    title="Inteligentny Magazyn"
                    badge="AI Prediction"
                >
                    <div className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-100 italic text-sm text-orange-800 font-medium">
                        "System myśli za Ciebie i przewiduje braki na podstawie terminarza."
                    </div>
                    <ul className="space-y-4">
                        <FeatureItem
                            icon={<TrendingDown size={14} />}
                            text={<><b>WG TERMINARZA</b>: Ostrzeżenie o braku produktu na konkretną wizytę.</>}
                        />
                        <FeatureItem
                            icon={<ArrowRight size={14} />}
                            text="Automatyczne zdejmowanie gramów ze stanu po zapisaniu wizyty."
                        />
                        <FeatureItem
                            icon={<RefreshCcw size={14} />}
                            text="Szybkie uzupełnianie stanu po zakupie nowej dostawy."
                        />
                    </ul>
                </HelpCard>

                {/* 4. Finance */}
                <HelpCard
                    icon={<BarChart3 className="text-green-600" />}
                    title="Finanse i Raporty"
                    badge="Analityka"
                >
                    <ul className="space-y-4">
                        <FeatureItem
                            icon={<DollarSign size={14} />}
                            text="Widok Przychodu Netto (Zarobek minus koszty materiałów i stałe)."
                        />
                        <FeatureItem
                            icon={<FileText size={14} />}
                            text="Automatyczne generowanie kosztów stałych (Czynsz, ZUS) co miesiąc."
                        />
                        <FeatureItem
                            icon={<ArrowRight size={14} />}
                            text="Porównywanie miesięcy i dowolnych zakresów dat."
                        />
                    </ul>
                </HelpCard>
            </div>

            {/* Safety & Backup */}
            <div className="bg-gray-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl">
                <div className="bg-white/10 p-4 rounded-2xl">
                    <ShieldCheck size={48} className="text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-2">Twoje dane są u Ciebie bezpieczne</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        Wszystkie informacje są przechowywane w Twojej przeglądarce. Pamiętaj, aby raz w tygodniu w zakładce <b>"Baza"</b> pobrać kopię zapasową pliku JSON. Dzięki temu nigdy nie stracisz swojej bazy, nawet po zmianie komputera.
                    </p>
                    <div className="flex gap-4">
                        <span className="text-[10px] uppercase font-black tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">Prywatność</span>
                        <span className="text-[10px] uppercase font-black tracking-widest bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">Bezpieczeństwo</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HelpCard = ({ icon, title, badge, children }: { icon: React.ReactElement, title: string, badge: string, children: React.ReactNode }) => (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30 flex flex-col group hover:-translate-y-1 transition-all">
        <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-primary/5 transition-colors">
                {React.cloneElement(icon, { size: 24 } as any)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 group-hover:text-primary/50">{badge}</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-6">{title}</h2>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

const FeatureItem = ({ icon, text }: { icon: React.ReactNode, text: React.ReactNode }) => (
    <li className="flex gap-3 items-start text-sm text-gray-500 font-medium leading-relaxed">
        <div className="mt-1 text-gray-300 shrink-0">
            {icon}
        </div>
        <span>{text}</span>
    </li>
);

export default HelpPage;
