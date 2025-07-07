import React, { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '@/contexts/AuthProvider.tsx';
import {configs} from '@/config.ts'
// --- Sync Options Interface ---
interface SyncOptions {
    batchSize?: number;
    state?: 'all' | 'open' | 'closed';
    syncLimit?: number;
    fullSync?: boolean;
    since?: string; // ISO date string
}

// --- Sync Response Interface ---
interface SyncResponse {
    issueCount: number;
    message?: string;
    timestamp?: string;
}

// --- Component Props ---
interface SyncButtonProps {
    className?: string;
    showAdvancedOptions?: boolean;
    onSyncComplete?: (success: boolean, issueCount: number, message: string) => void;
    onSyncStart?: (userLogin: string, timestamp: string) => void;
}

export const SyncButton: React.FC<SyncButtonProps> = ({
    className = '',
    showAdvancedOptions = false,
    onSyncComplete,
    onSyncStart
}) => {
    // --- Get current user from auth ---
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

    // --- Use the useApi hook for sync ---
    const syncApiCall = useCallback(async (signal: AbortSignal) => {
        if (!triggerSync) return Promise.resolve(null);
        
        // Format current timestamp properly
        const now = new Date();
        const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
        onSyncStart?.(currentUser, timestamp);
        
        return fetch(`${configs.BACKEND_URL}/sync/run`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...syncOptions,
                triggeredBy: currentUser,
                triggeredAt: timestamp
            }),
            signal
        }).then(async (response) => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('User is not authenticated');
                }
                const errorText = await response.text();
                throw new Error(`Sync failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
            }
            
            if (response.status === 204) {
                return { issueCount: 0, message: 'No new issues to sync' };
            }
            
            return response.json() as Promise<SyncResponse>;
        });
    }, [triggerSync, syncOptions, onSyncStart, currentUser]);

    const { data: syncResult, isLoading, error } = useApi(syncApiCall);

    // --- Handle sync completion ---
    React.useEffect(() => {
        if (syncResult !== null && !isLoading && triggerSync) {
            const issueCount = syncResult?.issueCount || 0;
            const message = `Successfully synced ${issueCount} issues`;
            
            onSyncComplete?.(true, issueCount, message);
            setTriggerSync(false);
        }
    }, [syncResult, isLoading, triggerSync, onSyncComplete]);

    // --- Handle sync errors ---
    React.useEffect(() => {
        if (error && !isLoading && triggerSync) {
            onSyncComplete?.(false, 0, error);
            setTriggerSync(false);
        }
    }, [error, isLoading, triggerSync, onSyncComplete]);

    // --- Trigger Functions ---
    const handleQuickSync = () => {
        setSyncOptions(prev => ({ ...prev, fullSync: false }));
        setTriggerSync(true);
    };

    const handleFullSync = () => {
        setSyncOptions(prev => ({ ...prev, fullSync: true }));
        setTriggerSync(true);
    };

    // --- Handle Options Change ---
    const handleOptionChange = (key: keyof SyncOptions, value: any) => {
        setSyncOptions(prev => ({ ...prev, [key]: value }));
    };

    // --- Status Icon Component ---
    const StatusIcon = () => {
        if (isLoading) {
            return (
                <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            );
        }

        if (error) {
            return (
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            );
        }

        if (syncResult) {
            return (
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            );
        }

        return (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        );
    };

    // --- Get Status Message ---
    const getStatusMessage = () => {
        if (isLoading) return `Syncing... (started by ${currentUser})`;
        if (error) return `Sync failed: ${error}`;
        if (syncResult) return `Synced ${syncResult.issueCount} issues`;
        return null;
    };

    const statusMessage = getStatusMessage();

    return (
        <div className={`relative ${className}`}>
            {/* --- Main Sync Button --- */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={handleQuickSync}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all duration-200 hover:scale-105"
                    title={isLoading ? `Syncing as ${currentUser}...` : `Run incremental sync as ${currentUser}`}
                >
                    <StatusIcon />
                    <span className="hidden sm:inline">
                        {isLoading ? 'Syncing...' : 'Sync'}
                    </span>
                </button>

                {/* --- Options Toggle --- */}
                {showAdvancedOptions && (
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        disabled={isLoading}
                        className="p-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition-colors"
                        title="Sync options"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                )}
            </div>

            {/* --- Status Message --- */}
            {statusMessage && (
                <div className={`absolute top-full left-0 mt-2 p-2 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg ${
                    error
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : syncResult
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                    {statusMessage}
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