import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { optionalAuth, protect, restrictTo } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as articles from '../controllers/articleController.js';
import * as categories from '../controllers/categoryController.js';
import * as comments from '../controllers/commentController.js';
import * as bookmarks from '../controllers/bookmarkController.js';
import { isDbConnected } from '../config/db.js';
import { langOf, translateMessage } from '../utils/i18n.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ message: translateMessage('बहुत ज़्यादा प्रयास, कुछ देर बाद फिर कोशिश करें', langOf(req)) }),
});

const editorial = [protect, restrictTo('editor', 'admin')];

// Used by hosts as a liveness/readiness probe: 503 when MongoDB is unreachable.
router.get('/health', (_req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({ ok: connected, db: connected ? 'connected' : 'disconnected' });
});

// auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.get('/auth/me', protect, auth.me);

// categories
router.get('/categories', categories.listCategories);

// articles — fixed paths must be registered before "/:slug"
router.get('/articles', articles.listArticles);
router.get('/articles/home', articles.homeFeed);
router.get('/articles/admin/stats', ...editorial, articles.adminStats);
router.get('/articles/admin/list', ...editorial, articles.adminList);
router.get('/articles/admin/:id', ...editorial, articles.adminGet);
router.post('/articles', ...editorial, articles.createArticle);
router.put('/articles/:id', ...editorial, articles.updateArticle);
router.delete('/articles/:id', ...editorial, articles.deleteArticle);
router.get('/articles/:slug', optionalAuth, articles.getArticle);

// comments
router.get('/comments/:articleId', comments.listComments);
router.post('/comments/:articleId', protect, comments.addComment);
router.delete('/comments/item/:id', protect, comments.deleteComment);

// bookmarks
router.get('/bookmarks', protect, bookmarks.listBookmarks);
router.post('/bookmarks/:articleId', protect, bookmarks.toggleBookmark);

export default router;
