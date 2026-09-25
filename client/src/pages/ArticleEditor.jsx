import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArticleImage from '../components/ArticleImage';
import { ErrorBox, Loading } from '../components/Feedback';
import { fetchAdminArticle, resetEditor, saveArticle } from '../features/admin/adminSlice';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';
import { useTitle } from '../utils/useTitle';

const EMPTY = {
  title: '',
  summary: '',
  body: '',
  category: '',
  image: '',
  imageAlt: '',
  authorName: 'नवभारत डेस्क', // i18n-ignore: stored data; the API shows "Navbharat Desk" in English
  tags: '',
  isBreaking: false,
  isFeatured: false,
  status: 'published',
  en: { title: '', summary: '', body: '', tags: '', imageAlt: '' },
};

const fromArticle = (a) => ({
  ...EMPTY,
  ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, a[k] ?? EMPTY[k]])),
  category: a.category?._id ?? a.category ?? '',
  tags: (a.tags ?? []).join(', '),
  en: { ...EMPTY.en, ...(a.en ?? {}), tags: (a.en?.tags ?? []).join(', ') },
});

export default function ArticleEditor() {
  const { id } = useParams();
  const { t } = useI18n();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const categories = useSelector((s) => s.categories.items);
  const { editor, saving } = useSelector((s) => s.admin);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  useTitle(id ? t('खबर संपादित करें') : t('नई खबर'));

  useEffect(() => {
    setForm(EMPTY);
    if (id) dispatch(fetchAdminArticle(id));
    return () => dispatch(resetEditor());
  }, [id, dispatch]);

  useEffect(() => {
    if (editor.article) setForm(fromArticle(editor.article));
  }, [editor.article]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setEn = (key) => (e) => setForm((f) => ({ ...f, en: { ...f.en, [key]: e.target.value } }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await dispatch(saveArticle({ id, data: form }));
    if (saveArticle.fulfilled.match(result)) {
      dispatch(showToast(id ? t('खबर अपडेट हो गई') : t('खबर सेव हो गई')));
      navigate('/admin');
    } else {
      setError(result.payload || t('खबर सेव नहीं हो सकी'));
    }
  };

  if (id && editor.status === 'loading') return <Loading />;
  if (id && editor.status === 'error') {
    return (
      <main className="wrap page-content">
        <ErrorBox message={editor.error} />
      </main>
    );
  }

  return (
    <main className="wrap page-content">
      <div className="page-head">
        <Link className="crumbs" to="/admin">
          {t('← एडिटोरियल पैनल')}
        </Link>
        <h1>{id ? t('खबर संपादित करें') : t('नई खबर')}</h1>
      </div>

      <form className="editor" onSubmit={submit}>
        <div className="editor-main">
          <h2 className="editor-heading">{t('हिंदी संस्करण')}</h2>
          <label>
            {t('शीर्षक')}
            <input value={form.title} onChange={set('title')} maxLength={200} required />
          </label>
          <label>
            {t('सार')}
            <textarea rows={3} value={form.summary} onChange={set('summary')} maxLength={400} required />
          </label>
          <label>
            {t('खबर')}
            <textarea rows={12} value={form.body} onChange={set('body')} required />
            <small>{t('अनुच्छेद अलग करने के लिए एक खाली लाइन छोड़ें।')}</small>
          </label>

          <h2 className="editor-heading">{t('अंग्रेज़ी संस्करण (वैकल्पिक)')}</h2>
          <p className="editor-hint">{t('खाली छोड़ने पर अंग्रेज़ी पाठकों को हिंदी संस्करण दिखेगा। भरें तो शीर्षक, सार और खबर तीनों ज़रूरी हैं।')}</p>
          <label>
            {t('अंग्रेज़ी शीर्षक')}
            <input lang="en" value={form.en.title} onChange={setEn('title')} maxLength={200} />
          </label>
          <label>
            {t('अंग्रेज़ी सार')}
            <textarea lang="en" rows={3} value={form.en.summary} onChange={setEn('summary')} maxLength={400} />
          </label>
          <label>
            {t('अंग्रेज़ी खबर')}
            <textarea lang="en" rows={10} value={form.en.body} onChange={setEn('body')} />
          </label>
          <label>
            {t('अंग्रेज़ी टैग')}
            <input lang="en" value={form.en.tags} onChange={setEn('tags')} placeholder={t('अल्पविराम से अलग करें')} />
          </label>
          <label>
            {t('अंग्रेज़ी इमेज विवरण')}
            <input lang="en" value={form.en.imageAlt} onChange={setEn('imageAlt')} maxLength={200} />
          </label>
        </div>

        <aside className="editor-side">
          <label>
            {t('श्रेणी')}
            <select value={form.category} onChange={set('category')} required>
              <option value="">{t('चुनें…')}</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('स्थिति')}
            <select value={form.status} onChange={set('status')}>
              <option value="published">{t('प्रकाशित')}</option>
              <option value="draft">{t('ड्राफ्ट')}</option>
            </select>
          </label>
          <label>
            {t('लेखक')}
            <input value={form.authorName} onChange={set('authorName')} maxLength={80} />
          </label>
          <label>
            {t('इमेज लिंक')}
            <input type="url" value={form.image} onChange={set('image')} placeholder="https://…" />
          </label>
          {form.image && <ArticleImage className="editor-preview" src={form.image} alt={t('प्रीव्यू')} />}
          <label>
            {t('इमेज का विवरण')}
            <input value={form.imageAlt} onChange={set('imageAlt')} maxLength={200} />
          </label>
          <label>
            {t('टैग')}
            <input value={form.tags} onChange={set('tags')} placeholder={t('अल्पविराम से अलग करें')} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.isBreaking} onChange={set('isBreaking')} /> {t('ब्रेकिंग न्यूज़')}
          </label>
          <label className="check">
            <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /> {t('होमपेज की मुख्य खबर')}
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t('सेव हो रहा है…') : id ? t('अपडेट करें') : t('सेव करें')}
          </button>
        </aside>
      </form>
    </main>
  );
}
