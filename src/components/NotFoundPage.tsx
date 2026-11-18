import { Link } from "react-router-dom";
import "./DetailPage.css";

// Client-side 404 for the router's catch-all route (and for a valid-looking
// slug that doesn't match any project/archive) — the static public/404.html
// still covers genuinely unknown paths at the CDN level, but once Vercel's
// SPA rewrite is in place, any path under this app renders through React
// first, so the app needs its own "not found" view too.
export default function NotFoundPage() {
  return (
    <div className="detail-page detail-page--notfound">
      <div className="detail-notfound-code">404</div>
      <p className="detail-notfound-message">This page doesn't exist — the link may be broken, or the page has moved.</p>
      <Link to="/" className="detail-back">
        Back to portfolio →
      </Link>
    </div>
  );
}
