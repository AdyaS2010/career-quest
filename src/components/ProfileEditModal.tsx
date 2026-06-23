import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserCog, X, Globe2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadPrefs, savePrefs, TZ_OPTIONS } from '../lib/prefs';
import type { Profile } from '../lib/database.types';

// Edit your public identity + a couple of personal preferences. Name fields are
// saved to the database; leaderboard visibility and timezone are saved locally
// (and best-effort to the profile row, so they sync if those columns exist).
export function ProfileEditModal({ profile, userId, onClose, onSaved }: {
  profile: Profile;
  userId: string;
  onClose: () => void;
  onSaved: (p: Partial<Profile>) => void;
}) {
  const prefs = loadPrefs(userId);
  const [username, setUsername] = useState(profile.username ?? '');
  const [characterName, setCharacterName] = useState(profile.character_name ?? '');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(prefs.showOnLeaderboard);
  const [tz, setTz] = useState(prefs.tz);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const name = username.trim();
    if (!name) { setError('Display name cannot be empty.'); return; }
    setSaving(true); setError(null);
    // Local-first preferences always succeed.
    savePrefs(userId, { showOnLeaderboard, tz });
    try {
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ username: name, character_name: characterName.trim() || null } as never)
        .eq('id', userId);
      if (dbErr) {
        setError(dbErr.code === '23505' ? 'That display name is already taken.' : 'Could not save your name. Please try again.');
        setSaving(false);
        return;
      }
      // Best-effort: persist prefs to the row too (no-op/ignored if columns are absent).
      try { await supabase.from('profiles').update({ show_on_leaderboard: showOnLeaderboard, timezone: tz } as never).eq('id', userId); } catch { /* optional columns */ }
      onSaved({ username: name, character_name: characterName.trim() || null });
      onClose();
    } catch {
      setError('Something went wrong while saving.');
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[2rem] border-4 p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface-card)', borderColor: 'rgba(251, 191, 36, 0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <UserCog className="w-7 h-7 text-amber-500" /> Edit Profile
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-full hover:bg-black/10 transition-colors">
            <X className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Display name */}
          <label className="block">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Display name</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              maxLength={32}
              placeholder="Your name on the leaderboard"
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl border-2 outline-none focus:border-amber-400 transition-colors"
              style={{ background: 'var(--surface-muted, rgba(148,163,184,0.12))', borderColor: 'rgba(148,163,184,0.3)', color: 'var(--text-primary)' }}
            />
          </label>

          {/* Character name */}
          <label className="block">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Character name <span className="font-medium opacity-60">(optional)</span></span>
            <input
              value={characterName}
              onChange={e => setCharacterName(e.target.value)}
              maxLength={32}
              placeholder="Your hero's title"
              className="mt-1.5 w-full px-4 py-2.5 rounded-xl border-2 outline-none focus:border-amber-400 transition-colors"
              style={{ background: 'var(--surface-muted, rgba(148,163,184,0.12))', borderColor: 'rgba(148,163,184,0.3)', color: 'var(--text-primary)' }}
            />
          </label>

          {/* Leaderboard visibility */}
          <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--surface-muted, rgba(148,163,184,0.12))' }}>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: showOnLeaderboard ? 'rgba(16,185,129,0.18)' : 'rgba(148,163,184,0.18)' }}>
                {showOnLeaderboard ? <Eye className="w-6 h-6 text-emerald-500" /> : <EyeOff className="w-6 h-6 text-slate-400" />}
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Show on leaderboard</p>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{showOnLeaderboard ? 'Others can see your rank' : 'You compete privately'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnLeaderboard(v => !v)}
              role="switch"
              aria-checked={showOnLeaderboard}
              aria-label="Show on leaderboard"
              className="w-14 h-8 rounded-full relative transition-colors shrink-0"
              style={{ backgroundColor: showOnLeaderboard ? '#10b981' : '#cbd5e1' }}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${showOnLeaderboard ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Timezone */}
          <label className="block">
            <span className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Globe2 className="w-4 h-4 text-sky-500" /> Time zone
            </span>
            <p className="text-xs font-medium mb-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>Sets the city's day &amp; night sky.</p>
            <select
              value={tz}
              onChange={e => setTz(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-2 outline-none focus:border-amber-400 transition-colors"
              style={{ background: 'var(--surface-muted, rgba(148,163,184,0.12))', borderColor: 'rgba(148,163,184,0.3)', color: 'var(--text-primary)', colorScheme: 'light' }}
            >
              {TZ_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#ffffff', color: '#0f172a' }}>{o.label}</option>)}
            </select>
          </label>

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-black text-lg border-2 transition-all hover:scale-[1.02] active:scale-95"
            style={{ borderColor: 'rgba(148,163,184,0.4)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null} Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
