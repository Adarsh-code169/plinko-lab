'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import PlinkoBoard from '@/components/PlinkoBoard';

function VerifyForm() {
  const searchParams = useSearchParams();
  
  const [serverSeed, setServerSeed] = useState(searchParams.get('serverSeed') || '');
  const [clientSeed, setClientSeed] = useState(searchParams.get('clientSeed') || '');
  const [nonce, setNonce] = useState(searchParams.get('nonce') || '');
  const [dropColumn, setDropColumn] = useState(searchParams.get('dropColumn') || '6');

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  // Auto-verify if all params are present in URL
  useEffect(() => {
    if (serverSeed && clientSeed && nonce && dropColumn) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/verify?serverSeed=${serverSeed}&clientSeed=${clientSeed}&nonce=${nonce}&dropColumn=${dropColumn}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReplay = () => {
    if (isReplaying) return;
    setIsReplaying(true);
  };

  return (
    <div className="w-full max-w-4xl max-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Input Form */}
      <form onSubmit={handleVerify} className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border-t-4 border-t-emerald-500">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 uppercase">Server Seed</label>
          <input 
            type="text" 
            value={serverSeed}
            onChange={e => setServerSeed(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 font-mono text-white text-sm"
            required
            placeholder="e.g. b2a5f3f3..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 uppercase">Client Seed</label>
          <input 
            type="text" 
            value={clientSeed}
            onChange={e => setClientSeed(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 font-mono text-white text-sm"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 uppercase">Nonce</label>
            <input 
              type="text" 
              value={nonce}
              onChange={e => setNonce(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 font-mono text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1 uppercase">Drop Column</label>
            <input 
              type="number" 
              min="0"
              max="12"
              value={dropColumn}
              onChange={e => setDropColumn(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 font-mono text-white text-sm"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={isVerifying}
          className="w-full mt-4 py-4 rounded-xl font-bold tracking-widest uppercase text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
        >
          {isVerifying ? 'Verifying...' : 'Verify Cryptography'}
        </button>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-900 text-red-400 text-sm flex items-center gap-2">
            <XCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </form>

      {/* Output Results */}
      <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        {result ? (
          <>
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="font-medium">Verification Successful</p>
            </div>

            <div className="space-y-4 text-sm font-mono break-all mt-2">
               <div>
                 <span className="block text-gray-500 mb-1">Commit Hash Used:</span>
                 <span className="text-gray-300">{result.commitHex}</span>
               </div>
               <div>
                 <span className="block text-gray-500 mb-1">Combined Generative Seed:</span>
                 <span className="text-gray-300">{result.combinedSeed}</span>
               </div>
               <div>
                 <span className="block text-gray-500 mb-1">Peg Map Integrity Hash:</span>
                 <span className="text-gray-300">{result.pegMapHash}</span>
               </div>
               
               <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
                 <div>
                   <span className="block text-gray-500 mb-1">Final Bin Index:</span>
                   <span className="text-xl text-cyan-400">{result.binIndex}</span>
                 </div>
                 <div>
                   <span className="block text-gray-500 mb-1">Multiplier:</span>
                   <span className="text-xl text-yellow-400">{result.payoutMultiplier}x</span>
                 </div>
               </div>

               <button 
                  onClick={handleReplay}
                  disabled={isReplaying}
                  className="w-full mt-4 py-3 rounded-xl font-medium tracking-wide text-white bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 disabled:opacity-50"
                >
                  {isReplaying ? 'Replaying Path...' : 'Replay Deterministic Path'}
                </button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4 min-h-[300px]">
             <ShieldCheck className="w-16 h-16 stroke-[1.5]" />
             <p className="text-center max-w-xs">Enter round details to verify the cryptographic determinism of the outcome.</p>
          </div>
        )}
      </div>

      {/* Render the Plinko board visually to simulate replay */}
      {result && (
        <div className="md:col-span-2 mt-8">
           <h3 className="text-xl font-bold mb-4 text-center text-gray-300">Deterministic Path Replay</h3>
           <PlinkoBoard 
              path={result.path} 
              isDropping={isReplaying} 
              dropColumn={parseInt(dropColumn, 10)} 
              onDropComplete={() => setIsReplaying(false)}
              muted={false}
           />
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center gap-8">
       <header className="w-full max-w-4xl text-center mb-4">
         <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Fairness Verifier</h1>
         <p className="text-gray-400">Recompute round outcomes using deterministic commit-reveal mechanics.</p>
       </header>
       <Suspense fallback={<div className="text-cyan-400">Loading verifier...</div>}>
         <VerifyForm />
       </Suspense>
    </main>
  );
}
