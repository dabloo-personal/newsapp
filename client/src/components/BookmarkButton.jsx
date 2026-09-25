import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { selectIsBookmarked, toggleBookmark } from '../features/bookmarks/bookmarksSlice';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';

export default function BookmarkButton({ articleId, className = 'share-btn', withLabel = false }) {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((s) => s.auth.user);
  const saved = useSelector(selectIsBookmarked(articleId));

  const onClick = async () => {
    if (!user) {
      dispatch(showToast(t('खबर सेव करने के लिए लॉगिन करें')));
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    const result = await dispatch(toggleBookmark(articleId));
    if (toggleBookmark.fulfilled.match(result)) {
      dispatch(showToast(result.payload.bookmarked ? t('खबर सेव हो गई') : t('सेव की गई खबरों से हटा दी')));
    } else {
      dispatch(showToast(result.payload || t('कुछ गड़बड़ हुई')));
    }
  };

  return (
    <button
      type="button"
      className={`${className} ${saved ? 'is-saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? t('सेव हटाएं') : t('खबर सेव करें')}
      onClick={onClick}
    >
      {saved ? '★' : '☆'}
      {withLabel && <span> {saved ? t('सेव की गई') : t('सेव करें')}</span>}
    </button>
  );
}
