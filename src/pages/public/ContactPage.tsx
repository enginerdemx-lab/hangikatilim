import React from 'react';
import { ContactPage as BaseContactPage } from '../../../components/pages/ContactPage';
import { usePageSeo } from '../../hooks/usePageSeo';

const ContactPage: React.FC = () => {
    usePageSeo();
    return <BaseContactPage />;
};

export default ContactPage;
