// NOTE: This React client was originally created before migrating to a pure static implementation.
// To reduce editor / TypeScript warnings (missing axios module, implicit any, unstable keys, etc.)
// we refactor the file to be self‑contained, remove external HTTP calls, and rely on localStorage.
// If you no longer need the React version, you can safely delete the entire `client/` folder.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';

interface SeasonDef { name: string; months: number[]; bg: string }
const seasons: SeasonDef[] = [
  { name: 'Spring', months: [3, 4, 5], bg: 'bg-spring' },
  { name: 'Summer', months: [6, 7, 8], bg: 'bg-summer' },
  { name: 'Fall', months: [9, 10, 11], bg: 'bg-fall' },
  { name: 'Winter', months: [12, 1, 2], bg: 'bg-winter' }
];

function getSeason(month: number): SeasonDef {
  return seasons.find(s => s.months.includes(month)) ?? seasons[0];
}

const romanticBackgrounds: Record<string, string> = {
  'bg-spring': 'from-pink-200 via-green-100 to-yellow-200',
  'bg-summer': 'from-yellow-200 via-blue-200 to-green-200',
  'bg-fall': 'from-orange-200 via-red-100 to-yellow-300',
  'bg-winter': 'from-blue-100 via-indigo-200 to-white',
};

interface CalendarProps { onDateClick: (date: string) => void }
const Calendar: React.FC<CalendarProps> = ({ onDateClick }) => {
  const today = useMemo(()=> new Date(), []);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1); // 1-12

  const goPrev = useCallback(()=>{
    setMonth(m => {
      if(m===1){ setYear(y=>y-1); return 12; }
      return m-1;
    });
  },[]);
  const goNext = useCallback(()=>{
    setMonth(m => {
      if(m===12){ setYear(y=>y+1); return 1; }
      return m+1;
    });
  },[]);

  const dates = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const arr: (number|null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <button aria-label="Previous Month" className="px-2 py-1 text-sm rounded bg-pink-100 hover:bg-pink-200" onClick={goPrev}>‹</button>
        <div className="font-semibold">{year} - {month.toString().padStart(2,'0')}</div>
        <button aria-label="Next Month" className="px-2 py-1 text-sm rounded bg-pink-100 hover:bg-pink-200" onClick={goNext}>›</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="font-bold text-center text-xs tracking-wide">{d}</div>
        ))}
        {dates.map((d, i) => {
          const key = d ? `d-${year}-${month}-${d}` : `blank-${i}`;
            return (
              <div key={key} className="h-14 flex items-center justify-center">
                {d && (
                  <button
                    className="w-10 h-10 text-sm rounded-full hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                    onClick={() => onDateClick(`${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`)}
                  >
                    {d}
                  </button>
                )}
              </div>
            );
        })}
      </div>
    </div>
  );
};

const STORAGE_KEY_PREFIX = 'memories-react-note:';
const TRAFFIC_KEY = 'memories-react-traffic';

const App: React.FC = () => {
  const today = useMemo(()=> new Date(), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [traffic, setTraffic] = useState(0);
  const [loading, setLoading] = useState(false);

  const season = useMemo(()=> getSeason(today.getMonth() + 1), [today]);
  const bgClass = romanticBackgrounds[season.bg];

  // Simulated distinct visitor counter (localStorage)
  useEffect(() => {
    try {
      const existed = localStorage.getItem(TRAFFIC_KEY);
      if(!existed){ localStorage.setItem(TRAFFIC_KEY, '1'); setTraffic(1); }
      else { setTraffic(parseInt(existed,10)); }
    } catch { /* ignore */ }
  }, []);

  // Load note when modal opens
  useEffect(() => {
    if(!selectedDate){ return; }
    setLoading(true);
    const k = STORAGE_KEY_PREFIX + selectedDate;
    try {
      const stored = localStorage.getItem(k) || '';
      setNote(stored);
    } catch { setNote(''); }
    setLoading(false);
  }, [selectedDate]);

  const saveNote = useCallback(() => {
    if(!selectedDate) return;
    try { localStorage.setItem(STORAGE_KEY_PREFIX + selectedDate, note); }
    catch {/* ignore */}
    // feedback can be subtle instead of alert
  }, [selectedDate, note]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${bgClass}`}>
      <div className="bg-white bg-opacity-80 rounded-xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-3xl font-extrabold text-pink-600 mb-2">Memories Calendar</h1>
        <p className="mb-4 text-gray-700">A romantic calendar to save your memories. Distinct visitors: <span className="font-bold text-indigo-600">{traffic}</span></p>
        <Calendar onDateClick={setSelectedDate} />
        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-10">
            <div className="bg-white rounded-lg p-6 shadow-lg w-80 relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-pink-500" onClick={() => setSelectedDate(null)}>×</button>
              <h2 className="text-xl font-bold mb-2">{selectedDate}</h2>
              {loading ? <div>Loading...</div> : (
                <>
                  <textarea
                    className="w-full h-24 p-2 border rounded mb-2"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Write your memory..."
                  />
                  <button
                    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
                    onClick={saveNote}
                  >Save</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
