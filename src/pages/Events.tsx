import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MarketplaceNav } from '../components/MarketplaceNav';

interface AnnouncementRow {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
}

/** Community events + announcements feed. */
export function Events() {
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(25)
      .then(({ data }) => {
        setItems((data as AnnouncementRow[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <header className="site-header">
        <Link to="/" className="back-link">← Home</Link>
        <h1>The Kingdom Emporium</h1>
        <p className="tagline">Events & Announcements</p>
      </header>
      <MarketplaceNav />
      <main className="directory-main">
        {loading
          ? <p className="loading-msg">Loading events…</p>
          : items.length > 0
            ? (
              <div className="events-list">
                {items.map(a => (
                  <article key={a.id} className="event-card">
                    {a.title && <h3>{a.title}</h3>}
                    <p>{a.body}</p>
                    <time className="event-date">
                      {new Date(a.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </time>
                  </article>
                ))}
              </div>
            )
            : <p className="empty-msg">No events posted right now — check back soon. Sunday Funday updates land here first.</p>
        }
      </main>
    </div>
  );
}
