// --- Content from: src/app/book/[token]/page.tsx ---

'use client';

import { useState, use } from 'react';
import useSWR from 'swr';

interface BookingData {
  interviewerName: string;
  slots: string[]; // ISO Date strings
  jobTitle?: string;
}

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Invalid link');
    }
    return res.json();
  });

export default function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const { token } = resolvedParams;

  const { data, error, isLoading, mutate } = useSWR<BookingData>(
    `${process.env.NEXT_PUBLIC_API_URL}/interviews/booking/${token}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/booking/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot: selectedSlot }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          alert('This slot was just taken. Please select another.');
          mutate(); // Refresh slots immediately
          setSelectedSlot(null); // Deselect the taken slot
        } else if (res.status === 400) {
          const err = await res.json();
          alert(err.message || 'Booking failed');
        } else {
          throw new Error('Booking failed');
        }
        return;
      }
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Could not book the slot. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const groupedSlots = data?.slots.reduce((acc, slot) => {
    const dateKey = new Date(slot).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, string[]>) || {};

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-soft-grey)]">
      <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-soft-grey)] p-4">
      <div className="bg-white p-8 rounded-[var(--radius-xl)] shadow-lg max-w-md text-center border border-[var(--color-border-subtle)]">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-[var(--color-gunmetal)] mb-2">Unable to load</h3>
        <p className="text-[var(--color-slate)]">{error.message}</p>
      </div>
    </div>
  );

  if (isSuccess) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-soft-grey)] p-4">
      <div className="bg-white p-12 rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] max-w-md text-center border border-[var(--color-border-subtle)] animate-scale-in">
        <div className="w-20 h-20 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          🎉
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-midnight)] mb-2">Interview Confirmed!</h2>
        <p className="text-[var(--color-slate)] mb-6">
          You are scheduled with <strong>{data?.interviewerName}</strong> on <br />
          <span className="font-semibold text-[var(--color-gunmetal)]">{selectedSlot && formatDate(selectedSlot)} at {selectedSlot && formatTime(selectedSlot)}</span>.
        </p>
        <div className="p-4 bg-[var(--color-soft-grey)] rounded-lg text-sm text-[var(--color-slate)]">
          A calendar invitation has been sent to your email.
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-soft-grey)] flex flex-col items-center py-12 px-4">

      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-[var(--color-midnight)] text-white rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg shadow-sm">
          A
        </div>
        <span className="font-bold text-xl tracking-tight text-[var(--color-midnight)]">
          ATS<span className="text-[var(--color-primary)]">.ai</span>
        </span>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] overflow-hidden border border-[var(--color-border-subtle)] bg-white">

        {/* Left Panel: Context */}
        <div className="col-span-1 bg-[var(--color-midnight)] p-8 flex flex-col text-white relative overflow-hidden">
          {/* Background Gradient decoration */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center text-center h-full">
            <div className="w-24 h-24 rounded-full bg-white/10 mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-inner border border-white/20">
              {data?.interviewerName?.[0]}
            </div>

            <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest mb-2">Interviewer</p>
            <h2 className="text-2xl font-bold text-white mb-1">{data?.interviewerName}</h2>
            <p className="text-sm text-white/60">Recruiting Team</p>

            <div className="w-full mt-auto pt-8 border-t border-white/10 space-y-5 text-left">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Role</p>
                <h3 className="text-lg font-semibold text-white">{data?.jobTitle || 'Screening Call'}</h3>
              </div>

              <div className="flex items-center gap-3 text-sm text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span>60 minutes</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-white/80">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <span>Video Call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Slots */}
        <div className="col-span-1 md:col-span-2 bg-white p-8 overflow-y-auto h-[70vh] md:h-[600px]">
          <h1 className="text-xl font-bold text-[var(--color-gunmetal)] mb-1">Select a Date & Time</h1>
          <p className="text-sm text-[var(--color-slate)] mb-8">Timezone: Local Browser Time</p>

          {Object.keys(groupedSlots).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[var(--color-slate)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-lg)]">
              <p>No available slots found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedSlots).map(([date, slots]) => (
                <div key={date}>
                  <h3 className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"></span>
                    {formatDate(slots[0])}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          text-center py-3 px-2 rounded-[var(--radius-md)] text-sm font-semibold border transition-all duration-200
                          ${selectedSlot === slot
                            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--shadow-md)] scale-105 ring-2 ring-[var(--color-primary)]/20'
                            : 'bg-white border-[var(--color-border-medium)] text-[var(--color-gunmetal)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:shadow-sm'
                          }
                        `}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar (Mobile) */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden p-4 bg-white/90 backdrop-blur-md border-t border-[var(--color-border-subtle)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <button
            onClick={handleConfirm}
            disabled={isBooking}
            className="w-full bg-[var(--color-primary)] text-white py-3 rounded-[var(--radius-md)] font-bold shadow-[var(--shadow-md)] active:scale-[0.98] transition-all"
          >
            {isBooking ? 'Confirming...' : `Confirm for ${formatTime(selectedSlot)}`}
          </button>
        </div>
      )}

      {/* Floating Bar (Desktop) */}
      {selectedSlot && (
        <div className="hidden md:flex fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-[var(--shadow-xl)] border border-[var(--color-border-subtle)] rounded-full px-2 pl-6 py-2 items-center gap-6 animate-in slide-in-from-bottom-10 z-50">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--color-slate)] uppercase tracking-wider">Selected Time</span>
            <span className="font-bold text-[var(--color-gunmetal)] text-sm">{formatDate(selectedSlot)} • {formatTime(selectedSlot)}</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={isBooking}
            className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[var(--color-primary-hover)] shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isBooking ? 'Confirming...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  );
}