import { useDispatch } from 'react-redux';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';

export default function ShareButton({ article, className = 'share-btn', children }) {
  const dispatch = useDispatch();
  const { t } = useI18n();

  const share = async () => {
    const url = `${window.location.origin}/article/${article.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: article.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      dispatch(showToast(t('लिंक कॉपी हो गया')));
    } catch (err) {
      if (err?.name !== 'AbortError') dispatch(showToast(t('लिंक कॉपी नहीं हो सका')));
    }
  };

  return (
    <button type="button" className={className} onClick={share}>
      {children ?? t('↗ साझा करें')}
    </button>
  );
}
