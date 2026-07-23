import { Link } from 'react-router-dom';
import { useLocale } from '../lib/i18n';
import { BrandMark } from '../components/BrandMark';
import { Seo } from '../lib/seo';
import { FadeIn } from '../lib/motion';

export function NotFound() {
  const { ui } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-bg px-4 text-center">
      <Seo page="notfound" />
      <FadeIn className="flex flex-col items-center gap-5">
        <BrandMark className="h-14 w-14 text-accent" />
        <div className="font-heading text-7xl font-extrabold text-ink">404</div>
        <p className="text-lg text-muted">{ui('notfound.title')}</p>
        <Link to="/" className="bk-btn bk-btn-primary">
          {ui('notfound.back')}
        </Link>
      </FadeIn>
    </div>
  );
}
