import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '@/contexts/AuthProvider.tsx';
import { syncRun } from '@/utils/apiService';
import { configs } from '@/config';
// --- Sync Options Interface ---
interface SyncOptions {
    batchSize?: number;
    state?: 'all' | 'open' | 'closed';
    syncLimit?: number;
    fullSync?: boolean;
    since?: string; // ISO date string
}

interface EmployeeStats {
    updated: number;
    inserted: number;
    deleted: number;
    deletionsSkipped: number;
}
interface IssueStats {
    totalIssuesLog:   number;
    totalPr:          number;
    totalPrMerged:    number;
    totalIssueClosed: number;
}
interface SyncResponse {
    message:        string;
    issueCount:     number;
    expiration_date: string;
    employeeStats: EmployeeStats;
    issueStats:    IssueStats;
}
// --- Component Props ---
interface SyncButtonProps {
    className?: string;
    showAdvancedOptions?: boolean;
    onSyncComplete?: (
      success: boolean,
      employeeStats: EmployeeStats | null,
      issueStats: IssueStats | null,
      message: string
    ) => void;
    onSyncStart?: (userLogin: string, timestamp: string) => void;
}
  
export const SyncButton: React.FC<SyncButtonProps> = ({
        className = '',
        showAdvancedOptions = false,
        onSyncComplete,
        onSyncStart
    }) => {
        const { user } = useAuth();
        const currentUser = user?.login || 'unknown';
    
        const [showOptions, setShowOptions] = useState(false);
        const [triggerSync, setTriggerSync] = useState(false);
        const [syncOptions, setSyncOptions] = useState<SyncOptions>({
        batchSize: 100,
        state: 'all',
        syncLimit: 100000,
        fullSync: false
    });
    const [streamResult, setStreamResult] = useState<SyncResponse | null>(null);
    // SSE listener
    useEffect(() => {
        const es = new EventSource(`${configs.BACKEND_URL}/sync/stream`);
        es.addEventListener('sync_completed', e => {
        const payload: SyncResponse = JSON.parse((e as MessageEvent).data);
        setStreamResult(payload);
        onSyncComplete?.(true, payload.employeeStats, payload.issueStats, payload.message);
        });
        return () => es.close();
    }, [onSyncComplete]);


  
    const syncApiCall = useCallback(
      async (signal: AbortSignal) => {
        if (!triggerSync) return null;
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
        onSyncStart?.(currentUser, timestamp);
        return syncRun(
          {
            ...syncOptions,
            triggeredBy: currentUser,
            triggeredAt: timestamp
          },
          signal
        );
      },
      [triggerSync, syncOptions, onSyncStart, currentUser]
    );
  
    const { data: syncResult, isLoading, error } = useApi<SyncResponse>(syncApiCall);
    const resultToShow = streamResult ?? syncResult;

    // Auto-hide panel after 5s
    const panelTimeout = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
      if ((error || resultToShow) && triggerSync) {
        panelTimeout.current = setTimeout(() => {
          setTriggerSync(false);
          setStreamResult(null);
        }, 5000);
      }
      return () => {
        if (panelTimeout.current) clearTimeout(panelTimeout.current);
      };
    }, [error, resultToShow, triggerSync]);
  
    // Notify parent
    useEffect(() => {
      if (syncResult && !isLoading && triggerSync) {
        onSyncComplete?.(
          true,
          syncResult.employeeStats,
          syncResult.issueStats,
          syncResult.message
        );
        setTriggerSync(false);
      }
    }, [syncResult, isLoading, triggerSync, onSyncComplete]);
  
    useEffect(() => {
      if (error && !isLoading && triggerSync) {
        onSyncComplete?.(false, null, null, error as string);
        setTriggerSync(false);
      }
    }, [error, isLoading, triggerSync, onSyncComplete]);
  
    const handleQuickSync = () => {
      setSyncOptions(prev => ({ ...prev, fullSync: false }));
      setTriggerSync(true);
    };
    const handleFullSync = () => {
      setSyncOptions(prev => ({ ...prev, fullSync: true }));
      setTriggerSync(true);
    };
    const handleOptionChange = (key: keyof SyncOptions, value: any) => {
      setSyncOptions(prev => ({ ...prev, [key]: value }));
    };
  
    return (
      <div className={`inline-block relative ${className}`}>      
        <button
          onClick={handleQuickSync}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
          title={isLoading ? `Syncing as ${currentUser}...` : `Run incremental sync as ${currentUser}`}
        >
          {isLoading ? (
            <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : error ? (
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : resultToShow ? (
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync'}</span>
        </button>
        {(error || resultToShow) && (
          <div className="absolute top-full left-2 mt-1 w-48">
            <div className="absolute -top-2 left-3 w-3 h-3 bg-slate-800 rotate-45 border-t border-l border-slate-700" />
            <div className="mt-1 bg-slate-800 text-slate-100 text-xs rounded shadow-lg border border-slate-700 p-2">
              {error ? (
                <div className="font-medium text-red-400">Sync failed: {error}</div>
              ) : (
                <>
                  <div className="font-medium mb-1">✅ Sync Complete</div>
                  <div className="space-y-0.5">
                    <div>
                      <strong>Employees:</strong> upd {resultToShow!.employeeStats.updated}, ins {resultToShow!.employeeStats.inserted}
                    </div>
                    <div>
                      <strong>Issues:</strong> total {resultToShow!.issueStats.totalIssuesLog}, merged {resultToShow!.issueStats.totalPrMerged}
                    </div>
                    <div className="text-slate-400">
                      <strong>Expires:</strong> {resultToShow!.expiration_date}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {/* --- Advanced Options Panel --- */}
        {showOptions && showAdvancedOptions && (
            <div className="absolute top-full right-0 mt-2 p-4 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-64">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-slate-200 font-medium">Sync Options</h4>
                    <span className="text-xs text-slate-400">User: {currentUser}</span>
                </div>
                
                <div className="space-y-3">
                    {/* State Filter */}
                    <div>
                        <label className="block text-xs text-slate-300 mb-1">Issue State</label>
                        <select
                            value={syncOptions.state}
                            onChange={(e) => handleOptionChange('state', e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1 disabled:opacity-50"
                        >
                            <option value="all">All Issues</option>
                            <option value="open">Open Only</option>
                            <option value="closed">Closed Only</option>
                        </select>
                    </div>

                    {/* Batch Size */}
                    <div>
                        <label className="block text-xs text-slate-300 mb-1">Batch Size</label>
                        <select
                            value={syncOptions.batchSize}
                            onChange={(e) => handleOptionChange('batchSize', parseInt(e.target.value))}
                            disabled={isLoading}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1 disabled:opacity-50"
                        >
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="200">200</option>
                        </select>
                    </div>

                    {/* Sync Limit */}
                    <div>
                        <label className="block text-xs text-slate-300 mb-1">Max Issues</label>
                        <select
                            value={syncOptions.syncLimit}
                            onChange={(e) => handleOptionChange('syncLimit', parseInt(e.target.value))}
                            disabled={isLoading}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1 disabled:opacity-50"
                        >
                            <option value="1000">1,000</option>
                            <option value="10000">10,000</option>
                            <option value="100000">100,000</option>
                        </select>
                    </div>

                    {/* Since Date */}
                    <div>
                        <label className="block text-xs text-slate-300 mb-1">Since Date (optional)</label>
                        <input
                            type="datetime-local"
                            value={syncOptions.since || ''}
                            onChange={(e) => handleOptionChange('since', e.target.value || undefined)}
                            disabled={isLoading}
                            className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded px-2 py-1 disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4">
                    <button
                        onClick={handleQuickSync}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
                    >
                        Incremental Sync
                    </button>
                    <button
                        onClick={handleFullSync}
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:opacity-50 text-white text-xs rounded transition-colors"
                    >
                        Full Sync
                    </button>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                    <p>• Incremental: Updates since last sync</p>
                    <p>• Full: Syncs all issues from scratch</p>
                    <p>• Triggered by: <span className="text-slate-300">{currentUser}</span></p>
                </div>
            </div>
        )}
      </div>
    );
};