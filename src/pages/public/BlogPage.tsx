import React from 'react';
import { BlogPage as BaseBlogPage } from '../../../components/pages/BlogPage';
import { usePageSeo } from '../../hooks/usePageSeo';

const BlogPage: React.FC = () => {
    usePageSeo();
    return <BaseBlogPage />;
};

export default BlogPage;
