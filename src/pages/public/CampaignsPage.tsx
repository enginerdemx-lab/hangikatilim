import React from 'react';
import { CampaignsPage as BaseCampaignsPage } from '../../../components/pages/CampaignsPage';
import { useNavigate } from 'react-router-dom';
import { usePageSeo } from '../../hooks/usePageSeo';

const CampaignsPage: React.FC = () => {
    const navigate = useNavigate();
    usePageSeo();
    const handleNavigate = (page: string) => {
        if (page === 'home') {
            navigate('/');
        }
    };

    return <BaseCampaignsPage onNavigate={handleNavigate} />;
};

export default CampaignsPage;
