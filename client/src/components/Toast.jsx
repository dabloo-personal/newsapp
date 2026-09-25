import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearToast } from '../features/ui/uiSlice';

export default function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector((s) => s.ui.toast);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => dispatch(clearToast()), 2600);
    return () => clearTimeout(id);
  }, [toast, dispatch]);

  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
      {toast?.message}
    </div>
  );
}
