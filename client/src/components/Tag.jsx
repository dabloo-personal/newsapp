import { Link } from 'react-router-dom';

export default function Tag({ category, link = false }) {
  if (!category) return null;
  const cls = `section-tag ${category.color === 'lime' ? '' : category.color}`.trim();
  return link ? (
    <Link className={cls} to={`/category/${category.slug}`}>
      {category.name}
    </Link>
  ) : (
    <span className={cls}>{category.name}</span>
  );
}
