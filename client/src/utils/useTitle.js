import { useEffect } from 'react';
import { useI18n } from '../i18n';

export function useTitle(title) {
  const { t } = useI18n();
  useEffect(() => {
    const site = `${t('नवभारत')} 24x7`;
    document.title = title ? `${title} | ${site}` : `${site} | ${t('आपकी खबर, आपकी आवाज़')}`;
  }, [title, t]);
}
