
import React, { useState, useEffect } from 'react';
import { Home, Wallet, Car, Shield, Truck, Award, Building, FileText, Users, TrendingUp } from 'lucide-react';
import { homeContentApi } from '../src/services/api/homeContent';

interface InfoCard {
    id: string;
    title: string;
    description: string;
    icon_name: string;
    order_index: number;
}

// Icon mapping
const iconMap: { [key: string]: React.FC<{ size?: number }> } = {
    Home,
    Wallet,
    Car,
    Shield,
    Truck,
    Award,
    Building,
    FileText,
    Users,
    TrendingUp
};

// Fallback data
const fallbackCards: InfoCard[] = [
    {
        id: '1',
        title: 'Dayanışma Tasarrufu',
        description: 'Belirli bir amaca yönelik bir araya gelen kişiler, her ay düzenli ödemeler yaparak finansal güçlerini birleştirirler.',
        icon_name: 'Home',
        order_index: 0
    },
    {
        id: '2',
        title: 'Faizsiz Sistem',
        description: 'Klasik kredi sistemlerinden farklı olarak, vade farkı veya faiz ödemezsiniz. Sadece organizasyon katılım bedeli alınır.',
        icon_name: 'Wallet',
        order_index: 1
    },
    {
        id: '3',
        title: 'Erken Teslimat',
        description: 'Noter huzurunda yapılan çekilişlerle veya peşinatlı sistemlerle, vadeniz bitmeden evinizi veya aracınızı teslim alabilirsiniz.',
        icon_name: 'Car',
        order_index: 2
    }
];

export const InfoCards: React.FC = () => {
    const [cards, setCards] = useState<InfoCard[]>(fallbackCards);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        try {
            const data = await homeContentApi.getInfoCards();
            if (data && data.length > 0) {
                setCards(data);
            }
        } catch (error) {
            console.error('Failed to load info cards from Supabase:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName] || Home;
        return <IconComponent size={28} />;
    };

    if (loading) {
        return (
            <section id="info" className="bg-white dark:bg-slate-850 py-16 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            </section>
        );
    }

    return (
        <section id="info" className="bg-white dark:bg-slate-850 py-16 border-t border-gray-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl font-bold text-primary-900 dark:text-white mb-4">Tasarruf Finansmanı (Evim Sistemleri) Nedir?</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Tasarruf finansmanı, bireylerin ev veya araba gibi büyük ölçekli yatırımları, faiz maliyeti olmadan, dayanışma ve sıra sistemiyle finanse etmelerini sağlayan bir yöntemdir.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card) => (
                        <div key={card.id} className="bg-gray-50 dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 text-center hover:shadow-lg transition-all">
                            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
                                {getIcon(card.icon_name)}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">{card.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
