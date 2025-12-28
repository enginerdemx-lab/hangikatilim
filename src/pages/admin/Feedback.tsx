import React, { useEffect, useState } from 'react';
import { feedbackService, CalculationFeedback, FeedbackStats } from '../../services/api/feedbackService';
import { ThumbsUp, ThumbsDown, Trash2, RefreshCw, MessageSquare, TrendingUp, Users } from 'lucide-react';

type FilterType = 'all' | 'positive' | 'negative';

export const Feedback: React.FC = () => {
    const [feedbackList, setFeedbackList] = useState<CalculationFeedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [feedbacks, statistics] = await Promise.all([
                feedbackService.getFeedbackList({ filter, limit: 100 }),
                feedbackService.getFeedbackStats()
            ]);
            setFeedbackList(feedbacks);
            setStats(statistics);
        } catch (error) {
            console.error('Error loading feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;

        setDeleting(id);
        const success = await feedbackService.deleteFeedback(id);
        if (success) {
            setFeedbackList(prev => prev.filter(f => f.id !== id));
            loadData(); // Refresh stats
        }
        setDeleting(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Geri Bildirimler</h1>
                    <p className="text-gray-600 mt-1">Hesaplayıcı kullanıcı geri bildirimleri</p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Toplam</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <ThumbsUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pozitif</p>
                                <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <ThumbsDown className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Negatif</p>
                                <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Memnuniyet</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.positive_rate !== null ? `%${stats.positive_rate}` : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {(['all', 'positive', 'negative'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'all' && 'Tümü'}
                        {f === 'positive' && '👍 Pozitif'}
                        {f === 'negative' && '👎 Negatif'}
                    </button>
                ))}
            </div>

            {/* Feedback List */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-500">Yükleniyor...</p>
                    </div>
                ) : feedbackList.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Henüz geri bildirim yok</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {feedbackList.map((feedback) => (
                            <div key={feedback.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${feedback.is_positive
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-red-100 text-red-600'
                                            }`}>
                                            {feedback.is_positive ? (
                                                <ThumbsUp className="w-5 h-5" />
                                            ) : (
                                                <ThumbsDown className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium ${feedback.is_positive ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {feedback.is_positive ? 'Faydalı' : 'Faydalı Değil'}
                                                </span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(feedback.created_at)}
                                                </span>
                                            </div>
                                            {feedback.comment && (
                                                <p className="mt-1 text-gray-700">{feedback.comment}</p>
                                            )}
                                            {feedback.calculation_params && (
                                                <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded p-2 font-mono">
                                                    {JSON.stringify(feedback.calculation_params, null, 2).substring(0, 200)}
                                                    {JSON.stringify(feedback.calculation_params).length > 200 && '...'}
                                                </div>
                                            )}
                                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                                <Users className="w-3 h-3" />
                                                {feedback.user_id ? 'Kayıtlı Kullanıcı' : 'Anonim'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(feedback.id)}
                                        disabled={deleting === feedback.id}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Feedback;
