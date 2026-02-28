import { HomeFeedPage } from '@/components/home/HomeFeedPage';
import { useAuthStore } from '@/store/auth.store';
import { canCreateNewsOrUpdates } from '@/utils/permissions';

export const NewsPage = () => {
    const { user } = useAuthStore();
    return (
        <HomeFeedPage
            section="news"
            title="News & Announcements"
            subtitle="Official news and important announcements."
            canCreate={canCreateNewsOrUpdates(user as any)}
        />
    );
};
