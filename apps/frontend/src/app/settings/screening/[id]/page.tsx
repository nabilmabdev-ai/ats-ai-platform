// --- Content from: src/app/settings/screening/[id]/page.tsx ---

'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// --- Icons ---
const IconCheck = ({ className }: { className?: string }) => <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const IconWarning = ({ className }: { className?: string }) => <svg className={`w-5 h-5 ${className || ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const IconSparkles = () => <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

// --- Components ---

const TagInput = ({ label, placeholder, value, onChange }: { label: string, placeholder: string, value: string[], onChange: (value: string[]) => void }) => {
  const [inputValue, setInputValue] = useState('');

  // Refactored logic to add tag
  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  // [FIX] Add tag when user clicks away (e.g., clicking Save)
  const handleBlur = () => {
    addTag();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <label className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider mb-2 block">{label}</label>
      <div className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm bg-white transition-all focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 focus-within:border-[var(--color-primary)] min-h-[48px] flex flex-wrap gap-2 items-center">
        {value.map(tag => (
          <span key={tag} className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5 animate-in fade-in zoom-in duration-200">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--color-primary-hover)] font-bold transition-colors">×</button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur} /* [FIX] Added onBlur here */
          placeholder={value.length === 0 ? placeholder : ''}
          className="bg-transparent outline-none flex-1 min-w-[120px] text-sm text-[var(--color-gunmetal)] placeholder:text-[var(--color-neutral-400)] h-full"
        />
      </div>
    </div>
  );
}

const WeightVisualizer = ({ weights }: { weights: { criteria: string, value: number }[] }) => {
  const colors = ['bg-[var(--color-primary)]', 'bg-[var(--color-secondary-mint)]', 'bg-[var(--color-secondary-blue)]', 'bg-[var(--color-secondary-lilac)]'];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Weight Distribution</span>
        <span className="text-[10px] text-[var(--color-slate)] font-medium">Target: 100%</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
        {weights.map((w, i) => {
          const color = colors[i % colors.length];
          if (w.value <= 0) return null;
          return (
            <div
              key={i}
              style={{ width: `${w.value}%` }}
              className={`${color} transition-all duration-300 relative group`}
            >
              {/* Tooltip on Hover */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-[var(--color-gunmetal)] text-white text-[10px] py-1 px-2 rounded">
                {w.criteria}: {w.value}%
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface ScreeningTemplateData { id?: string; name: string; requiredSkills: string[]; niceToHaves: string[]; scoringWeights: Record<string, number>; }
const DEFAULT_WEIGHTS = [{ criteria: 'skills_match', value: 60 }, { criteria: 'experience_years', value: 30 }, { criteria: 'education_level', value: 10 },];

export default function ScreeningScorecardPage() {

  const router = useRouter();

  const params = useParams();

  const scorecardId = params.id as string;



  const [name, setName] = useState('');

  const [reqSkills, setReqSkills] = useState<string[]>([]);

  const [niceSkills, setNiceSkills] = useState<string[]>([]);

  const [weightList, setWeightList] = useState(DEFAULT_WEIGHTS);

  const [isLoading, setIsLoading] = useState(!!scorecardId);

  const [shake, setShake] = useState(false);



  // [NEW STATE]

  const [isGenerating, setIsGenerating] = useState(false);



  useEffect(() => {

    if (scorecardId && scorecardId !== 'new') {

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/screening/${scorecardId}`)

        .then(res => res.json())

        .then(t => {

          setName(t.name);

          setReqSkills(t.requiredSkills || []);

          setNiceSkills(t.niceToHaves || []);

          if (t.scoringWeights) {

            const list = Object.entries(t.scoringWeights).map(([k, v]) => ({ criteria: k, value: Math.round((v as number) * 100) }));

            if (list.length > 0) setWeightList(list);

          }

        }).finally(() => setIsLoading(false));

    } else {

      // If scorecardId is 'new', we don't need to load, so ensure isLoading is false.

      // This will only set isLoading if it's currently true, preventing unnecessary re-renders.

      if (isLoading) {

        // eslint-disable-next-line react-hooks/set-state-in-effect

        setIsLoading(false);

      }

    }

  }, [scorecardId, isLoading]);



  // --- NEW FUNCTION: Auto-Fill from AI ---

  const handleAutoGenerate = async () => {

    if (!name) {

      alert("Please enter a Role Title (e.g. 'Marketing Manager') first.");

      return;

    }



    setIsGenerating(true);

    try {

      const res = await fetch('http://localhost:8000/generate-scorecard', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ role_title: name }),

      });



      if (!res.ok) throw new Error('Generation failed');



      const data = await res.json();



      // 1. Populate Skills

      setReqSkills(data.requiredSkills || []);

      setNiceSkills(data.niceToHaves || []);



      // 2. Populate Weights (Convert 0.6 -> 60 for slider)

      if (data.scoringWeights) {

        const newWeights = Object.entries(data.scoringWeights).map(([k, v]) => ({

          criteria: k,

          value: Math.round((v as number) * 100),

        }));

        setWeightList(newWeights);

      }

    } catch (error) {

      console.error(error);

      alert("AI Service Unavailable");

    } finally {

      setIsGenerating(false);

    }

  };



  const handleSave = async () => {

    if (totalWeight !== 100) {

      setShake(true);

      setTimeout(() => setShake(false), 820);

      return;

    }

    const scoringWeights: Record<string, number> = {};

    weightList.forEach(w => { if (w.criteria) scoringWeights[w.criteria] = w.value / 100; });

    // [FIX] Ensure we don't send 'id' in the body for updates, as it's already in the URL

    const { ...restData } = {

      id: scorecardId === 'new' ? undefined : scorecardId,

      name,

      requiredSkills: reqSkills,

      niceToHaves: niceSkills,

      scoringWeights

    };

    const method = scorecardId && scorecardId !== 'new' ? 'PATCH' : 'POST';

    const url = scorecardId && scorecardId !== 'new'

      ? `${process.env.NEXT_PUBLIC_API_URL}/templates/screening/${scorecardId}`

      : `${process.env.NEXT_PUBLIC_API_URL}/templates/screening`;



    try {

      // Send restData (without ID)

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restData), });

      if (res.ok) router.push('/settings?tab=SCREENING');

      else alert('Failed to save scorecard');

    } catch (error) { console.error(error); }

  };



  const handleWeightChange = (index: number, val: string) => { const newList = [...weightList]; newList[index].value = Number(val); setWeightList(newList); };

  const handleCriteriaChange = (index: number, val: string) => { const newList = [...weightList]; newList[index].criteria = val; setWeightList(newList); };

  const addCriteria = () => setWeightList([...weightList, { criteria: 'new_criteria', value: 0 }]);

  const removeCriteria = (index: number) => setWeightList(weightList.filter((_, i) => i !== index));

  const handleNormalize = () => {
    const currentSum = weightList.reduce((acc, curr) => acc + curr.value, 0);
    if (currentSum === 0) {
      // Distribute equally
      const equalShare = Math.floor(100 / weightList.length);
      const remainder = 100 % weightList.length;
      const newList = weightList.map((w, i) => ({
        ...w,
        value: equalShare + (i < remainder ? 1 : 0)
      }));
      setWeightList(newList);
      return;
    }

    // Scale to 100
    let newSum = 0;
    const newList = weightList.map(w => {
      const newVal = Math.round((w.value / currentSum) * 100);
      newSum += newVal;
      return { ...w, value: newVal };
    });

    // Fix rounding errors
    const diff = 100 - newSum;
    if (diff !== 0 && newList.length > 0) {
      // Add diff to the largest value or the first one
      newList[0].value += diff;
    }
    setWeightList(newList);
  };



  // eslint-disable-next-line react-hooks/preserve-manual-memoization

  const totalWeight = useMemo(() => weightList.reduce((acc, curr) => acc + curr.value, 0), [weightList]);



  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-[var(--color-slate)]">Loading...</div>;



  return (

    <>

      <style jsx>{`

        /* Custom Range Slider Styling */

        input[type=range] {

            -webkit-appearance: none; /* Hides the slider so that custom slider can be made */

            width: 100%; /* Specific width is required for Firefox. */

            background: transparent; /* Otherwise white in Chrome */

        }



        input[type=range]::-webkit-slider-thumb {

            -webkit-appearance: none;

            height: 18px;

            width: 18px;

            border-radius: 50%;

            background: #ffffff;

            border: 2px solid var(--color-primary);

            cursor: pointer;

            margin-top: -7px; /* You need to specify a margin in Chrome, but in Firefox and IE it is automatic */

            box-shadow: 0 2px 4px rgba(0,0,0,0.1);

            transition: transform 0.1s ease;

        }

        

        input[type=range]::-webkit-slider-thumb:hover {

            transform: scale(1.1);

        }



        input[type=range]::-webkit-slider-runnable-track {

            width: 100%;

            height: 4px;

            cursor: pointer;

            border-radius: 2px;

        }



        input[type=range]:focus {

            outline: none;

        }



        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-3px, 0, 0); } 40%, 60% { transform: translate3d(3px, 0, 0); } }

        .shake { animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both; }

    `}</style>



      <div className="min-h-screen bg-[var(--color-background)] p-4 sm:p-8 pb-32 sm:pb-32">

        <div className="max-w-4xl mx-auto">



          <div className="mb-6 flex items-center gap-2">

            <Link href="/settings?tab=SCREENING" className="text-xs font-bold text-[var(--color-slate)] hover:text-[var(--color-gunmetal)] transition-colors flex items-center gap-1">

              <span className="text-lg">←</span> Back

            </Link>

          </div>



          {/* Main Card */}

          <div className="glass-card bg-white/80 backdrop-blur-xl border border-white/40 shadow-[var(--shadow-lg)] rounded-[var(--radius-xl)] overflow-hidden">



            {/* Header */}

            <div className="p-8 border-b border-[var(--color-border-subtle)] bg-gradient-to-r from-white to-[var(--color-neutral-50)]">

              <div className="flex items-center gap-3 mb-2">

                <div className="p-2 bg-[var(--color-primary)]/10 rounded-lg">

                  <IconSparkles />

                </div>

                <h2 className="text-2xl font-bold text-[var(--color-midnight)] tracking-tight">

                  {scorecardId === 'new' ? 'New AI Scorecard' : 'Edit AI Scorecard'}

                </h2>

              </div>

              <p className="text-sm text-[var(--color-slate)] max-w-lg">

                Configure the weights and keywords the AI Agent will use to evaluate and rank incoming resumes.

              </p>

            </div>



            <div className="p-8 space-y-10">



              {/* --- UPDATED NAME INPUT SECTION --- */}

              <div className="group">

                <label className="text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider mb-2 block group-focus-within:text-[var(--color-primary)] transition-colors">Scorecard Name / Role Title</label>

                <div className="flex gap-3">

                  <input

                    type="text"

                    required

                    value={name}

                    onChange={(e) => setName(e.target.value)}

                    className="input-base w-full h-12 text-lg font-medium text-[var(--color-gunmetal)] placeholder:text-[var(--color-neutral-300)]"

                    placeholder="e.g. Senior Backend Engineer"

                  />

                  <button

                    onClick={handleAutoGenerate}

                    disabled={isGenerating || !name}

                    className="btn-secondary flex items-center gap-2 px-4 h-12 whitespace-nowrap"

                    title="Auto-fill skills and weights based on title"

                  >

                    {isGenerating ? (

                      <span className="animate-spin">✨</span>

                    ) : (

                      <IconSparkles />

                    )}

                    <span>Auto-Fill</span>

                  </button>

                </div>

                <p className="text-[10px] text-[var(--color-text-soft)] mt-2">

                  Tip: Type a job title and click <strong>Auto-Fill</strong> to let AI suggest skills and weights.

                </p>

              </div>



              {/* Skills Inputs */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <TagInput label="Required Skills (Hard Constraints)" placeholder="e.g. React, Node.js" value={reqSkills} onChange={setReqSkills} />

                <TagInput label="Nice-to-Haves (Bonus Points)" placeholder="e.g. AWS, CI/CD" value={niceSkills} onChange={setNiceSkills} />

              </div>



              {/* Weights Section */}

              <div className="bg-[var(--color-neutral-50)]/50 rounded-[var(--radius-lg)] p-6 border border-[var(--color-border-subtle)]">

                <div className="mb-6">

                  <WeightVisualizer weights={weightList} />

                </div>



                <div className="space-y-2">

                  {weightList.map((item, i) => {

                    const colors = ['#FF6F91', '#A7F0BA', '#7EC8E3', '#C8B5F4'];

                    const color = colors[i % colors.length];



                    return (

                      <div key={i} className="flex items-center gap-4 py-2 group">

                        <div className="w-1/3">

                          <input

                            type="text"

                            value={item.criteria}

                            onChange={(e) => handleCriteriaChange(i, e.target.value)}

                            className="input-base text-sm font-medium border-transparent bg-transparent hover:bg-white hover:border-[var(--color-border-subtle)] focus:bg-white transition-all px-2 -ml-2"

                          />

                        </div>



                        <div className="flex-1 relative h-6 flex items-center">

                          {/* Track Background */}

                          <input

                            type="range"

                            min="0"

                            max="100"

                            value={item.value}

                            onChange={(e) => handleWeightChange(i, e.target.value)}

                            style={{

                              background: `linear-gradient(to right, ${color} 0%, ${color} ${item.value}%, var(--color-neutral-200) ${item.value}%, var(--color-neutral-200) 100%)`

                            }}

                            className="z-10 relative"

                          />

                        </div>



                        <div className="w-20 flex items-center justify-end gap-2">

                          <div className="relative">

                            <input

                              type="number"

                              value={item.value}

                              onChange={(e) => handleWeightChange(i, e.target.value)}

                              className="w-14 text-center border border-[var(--color-border-subtle)] rounded-md py-1 text-sm font-bold text-[var(--color-gunmetal)] focus:outline-none focus:border-[var(--color-primary)]"

                            />

                            <span className="absolute right-[-10px] top-1 text-xs text-[var(--color-slate)]">%</span>

                          </div>

                          <button type="button" onClick={() => removeCriteria(i)} className="text-[var(--color-neutral-400)] hover:text-[var(--color-error)] transition-colors p-1">

                            ×

                          </button>

                        </div>

                      </div>

                    );

                  })}

                </div>



                <button

                  type="button"

                  onClick={addCriteria}

                  className="mt-6 flex items-center gap-2 text-xs font-bold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors uppercase tracking-wider"

                >

                  <span className="text-lg leading-none">+</span> Add Criteria

                </button>

              </div>

            </div>

          </div>

        </div>

      </div>



      {/* Sticky Footer */}

      <div className={`fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[var(--color-border-subtle)] py-4 px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 transition-transform duration-300 ${shake ? 'shake' : ''}`}>

        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">



          <div className="flex flex-col gap-1 w-full sm:w-auto">

            <div className="flex items-center gap-3">

              {totalWeight === 100 ? (

                <div className="flex items-center gap-2 text-[var(--color-success-text)]">

                  <IconCheck className="w-5 h-5" />

                  <span className="font-bold text-sm">Total Weight: 100%</span>

                </div>

              ) : (

                <div className="flex items-center gap-2 text-[var(--color-warning-text)]">

                  <IconWarning className="w-5 h-5" />

                  <span className="font-bold text-sm">Total Weight: {totalWeight}%</span>

                </div>

              )}

            </div>

            {totalWeight !== 100 && (
              <button
                onClick={handleNormalize}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline ml-2"
              >
                Normalize to 100%
              </button>
            )}

            {/* Footer Progress Bar */}

            <div className="w-full sm:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">

              <div

                className={`h-full transition-all duration-500 ease-out ${totalWeight === 100 ? 'bg-[var(--color-success)]' : totalWeight > 100 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-warning)]'}`}

                style={{ width: `${Math.min(totalWeight, 100)}%` }}

              />

            </div>

          </div>



          <div className="flex gap-4 w-full sm:w-auto">

            <Link href="/settings?tab=SCREENING" className="flex-1 sm:flex-none">

              <button type="button" className="btn-secondary w-full">Cancel</button>

            </Link>

            <button

              onClick={handleSave}

              disabled={totalWeight !== 100 || !name}

              className={`btn-primary w-full sm:w-auto px-8 shadow-lg ${totalWeight !== 100 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}

            >

              {scorecardId === 'new' ? 'Create Scorecard' : 'Save Changes'}

            </button>

          </div>

        </div>

      </div>

    </>

  );

}
