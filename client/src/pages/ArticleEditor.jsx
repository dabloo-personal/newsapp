import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArticleImage from '../components/ArticleImage';
import { ErrorBox, Loading } from '../components/Feedback';
import { fetchAdminArticle, resetEditor, saveArticle } from '../features/admin/adminSlice';
import { showToast } from '../features/ui/uiSlice';
import { useI18n } from '../i18n';
import { translateHiToEn } from '../utils/translate';
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  useTitle(id ? t('खबर संपादित करें') : t('नई खबर'));

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = async () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
          const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

          if (cloudName && uploadPreset) {
            try {
              const formData = new FormData();
              formData.append('file', compressedDataUrl);
              formData.append('upload_preset', uploadPreset);
              const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
              });
              const data = await res.json();
              if (data.secure_url) {
                setForm((f) => ({ ...f, image: data.secure_url }));
                setUploadingImage(false);
                return;
              }
            } catch (cErr) {
              console.warn('Cloudinary upload fallback to compressed image:', cErr);
            }
          }

          setForm((f) => ({ ...f, image: compressedDataUrl }));
          setUploadingImage(false);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadingImage(false);
    }
  };

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

  const handleAutoTranslate = async () => {
    if (!form.title && !form.summary && !form.body) {
      dispatch(showToast(t('पहले हिंदी शीर्षक या खबर दर्ज करें')));
      return;
    }
    setTranslating(true);
    try {
      const [enTitle, enSummary, enBody, enTags, enImageAlt] = await Promise.all([
        translateHiToEn(form.title),
        translateHiToEn(form.summary),
        translateHiToEn(form.body),
        form.tags ? translateHiToEn(form.tags) : Promise.resolve(''),
        form.imageAlt ? translateHiToEn(form.imageAlt) : Promise.resolve(''),
      ]);

      if (!enTitle && !enSummary && !enBody) {
        dispatch(showToast(t('ट्रांसलेशन विफल हुआ')));
        return;
      }

      setForm((f) => ({
        ...f,
        en: {
          ...f.en,
          title: enTitle || f.en.title,
          summary: enSummary || f.en.summary,
          body: enBody || f.en.body,
          tags: enTags || f.en.tags,
          imageAlt: enImageAlt || f.en.imageAlt,
        },
      }));
      dispatch(showToast(t('अंग्रेज़ी संस्करण ऑटो-ट्रांसलेट हो गया!')));
    } catch (err) {
      console.error(err);
      dispatch(showToast(t('ट्रांसलेशन विफल हुआ')));
    } finally {
      setTranslating(false);
    }
  };

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

          <div className="editor-header-flex">
            <h2 className="editor-heading">{t('अंग्रेज़ी संस्करण (वैकल्पिक)')}</h2>
            <button
              type="button"
              className="translate-btn"
              onClick={handleAutoTranslate}
              disabled={translating}
            >
              {translating ? t('⏳ अनुवाद हो रहा है…') : t('✨ हिंदी से इंग्लिश ऑटो-ट्रांसलेट करें')}
            </button>
          </div>
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

          <div className="image-uploader">
            <label className="field-label">{t('खबर की फोटो (इमेज)')}</label>
            <input
              type="file"
              accept="image/*"
              id="local-image-input"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            {uploadingImage ? (
              <div className="upload-dropzone">
                <span className="upload-icon">⏳</span>
                <p>{t('फोटो प्रोसेस हो रही है…')}</p>
              </div>
            ) : !form.image ? (
              <div
                className="upload-dropzone"
                onClick={() => document.getElementById('local-image-input')?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('local-image-input')?.click()}
              >
                <span className="upload-icon">📷</span>
                <p>{t('कंप्यूटर से फोटो चुनें')}</p>
                <small>{t('क्लिक करके लोकल डिवाइस से इमेज सेलेक्ट करें')}</small>
              </div>
            ) : (
              <div className="image-preview-container">
                <ArticleImage className="editor-preview" src={form.image} alt={t('प्रीव्यू')} />
                <div className="image-preview-actions">
                  <button type="button" onClick={() => document.getElementById('local-image-input')?.click()}>
                    {t('दूसरी फोटो बदलें')}
                  </button>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                    {t('फोटो हटाएं')}
                  </button>
                </div>
              </div>
            )}

            {showUrlInput ? (
              <label style={{ marginTop: '8px' }}>
                {t('या वेब इमेज का यूआरएल (URL)')}
                <input
                  type="url"
                  value={form.image}
                  onChange={set('image')}
                  placeholder="https://…"
                />
              </label>
            ) : (
              <button
                type="button"
                className="url-toggle-btn"
                onClick={() => setShowUrlInput(true)}
              >
                {t('या इमेज लिंक (URL) दर्ज करें')}
              </button>
            )}
          </div>
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
