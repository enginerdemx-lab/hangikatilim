import React from 'react';
import { CampaignsPage as BaseCampaignsPage } from '../../../components/pages/CampaignsPage';
import { useNavigate } from 'react-router-dom';

const CampaignsPage: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        if (page === 'home') {
            navigate('/');
        }
    };

    return <BaseCampaignsPage onNavigate={handleNavigate} />;
};

export default CampaignsPage;
