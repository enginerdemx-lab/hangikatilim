import React from 'react';
import { CompaniesPage as BaseCompaniesPage } from '../../../components/pages/CompaniesPage';
import { usePageSeo } from '../../hooks/usePageSeo';

const CompaniesPage: React.FC = () => {
    usePageSeo();
    return <BaseCompaniesPage />;
};

export default CompaniesPage;
