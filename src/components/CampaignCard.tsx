import React from 'react';
import type { Campaign } from '../types/database';

interface CampaignCardProps {
    campaign: Campaign;
}

const badgeLabels = {
    faizsiz_firsat: 'Faizsiz Fırsat',
    ozel_kampanya: 'Özel Kampanya',
    sponsorlu: 'Sponsorlu',
};

const badgeColors = {
    faizsiz_firsat: 'bg-green-100 text-green-800',
    ozel_kampanya: 'bg-blue-100 text-blue-800',
    sponsorlu: 'bg-purple-100 text-purple-800',
};

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
    const { company } = campaign;

    if (!company) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-100">
            {/* Header with Images */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start gap-4">
                    {/* Left Side: Logo + Title */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-3">
                            {/* Company Logo */}
                            {company.logo_url && (
                                <div className="flex-shrink-0">
                                    <img
                                        src={company.logo_url}
                                        alt={company.name}
                                        className="w-16 h-16 object-contain rounded-lg bg-white p-2 shadow-sm"
                                    />
                                </div>
                            )}

                            {/* Company Name */}
                            <div className="flex-1">
                                <p className="text-sm text-gray-600 font-medium">{company.name}</p>
                            </div>
                        </div>

                        {/* Title and Badge */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 flex-1">
                                {campaign.title}
                            </h3>
                            {campaign.badge_type && (
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badgeColors[campaign.badge_type]
                                        }`}
                                >
                                    {badgeLabels[campaign.badge_type]}
                                </span>
                            )}
                        </div>

                        {/* Vade and Amount - Compact */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-semibold">{campaign.vade_months} Ay</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">{campaign.amount_tl.toLocaleString('tr-TR')} TL</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Campaign Image (PROMINENT) */}
                    {campaign.image_url && (
                        <div className="flex-shrink-0">
                            <img
                                src={campaign.image_url}
                                alt={campaign.title}
                                className="w-64 h-32 object-cover rounded-lg shadow-md border-2 border-white"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Campaign Details */}
            <div className="p-6">
                {/* Bullet Points */}
                {campaign.bullet_points && campaign.bullet_points.length > 0 && (
                    <ul className="space-y-2 mb-6">
                        {campaign.bullet_points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <svg
                                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {campaign.application_link && (
                        <a
                            href={campaign.application_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            Başvur
                        </a>
                    )}
                    {campaign.terms_link && (
                        <a
                            href={campaign.terms_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3 rounded-lg font-semibold text-gray-700 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                        >
                            Koşullar
                        </a>
                    )}
                </div>
            </div>

            {/* Company Info Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{company.name}</span>
                    {company.is_licensed && (
                        <span className="flex items-center gap-1 text-green-600">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Lisanslı
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
