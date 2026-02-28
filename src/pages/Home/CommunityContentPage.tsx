import { HomeFeedPage } from '@/components/home/HomeFeedPage';
import { useAuthStore } from '@/store/auth.store';
import { canCreateCommunityContent } from '@/utils/permissions';

export const CommunityContentPage = () => {
    const { user } = useAuthStore();

    return (
        <HomeFeedPage
            section="content"
            title="Community Content"
            subtitle="Photos, videos and creations shared by our creators."
            canCreate={canCreateCommunityContent(user)}
            wide // vamos adicionar esta prop no passo 3
        />
    );
};
