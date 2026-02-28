import { HomeFeedPage } from '@/components/home/HomeFeedPage';
import { useAuthStore } from '@/store/auth.store';
import { canCreateNewsOrUpdates } from '@/utils/permissions';

export const UpdatesPage = () => {
    const { user } = useAuthStore();
    return (
        <HomeFeedPage
            section="updates"
            title="Server Updates"
            subtitle="Patch notes, changelogs and server updates."
            canCreate={canCreateNewsOrUpdates(user as any)}
        />
    );
};
