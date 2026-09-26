import { useDispatch } from 'react-redux';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';

/** Clipboard API needs a secure context; fall back to a hidden textarea on plain http. */
async function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('copy failed');
  return undefined;
}

export default function ShareButton({ article, className = 'share-btn', children }) {
  const dispatch = useDispatch();
  const { t } = useI18n();

  const share = async () => {
    const url = `${window.location.origin}/article/${article.slug}`;
    try {
      // The native share sheet is what people expect on a phone; on desktop the button means "copy link".
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: article.title, url });
        return;
      }
      await copyText(url);
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
