
import React from 'react';
import { Map, AlertTriangle } from 'lucide-react';

const TopAttackersList = ({ data }) => {
    if (!data || data.length === 0) return (
        <div className="text-gray-500 text-sm text-center py-4">No data available</div>
    );

    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <AlertTriangle size={16} />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">{item.ip}</div>
                            <div className="text-xs text-gray-400">Source IP</div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-emerald-400">{item.count}</span>
                        <span className="text-xs text-gray-500">Alerts</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TopAttackersList;
