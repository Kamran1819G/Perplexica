import React from 'react';
import { Check, Plus } from 'lucide-react';

interface DiscoverInterestPanelProps {
    interests: string[];
    selected: string[];
    onSelect: (interest: string) => void;
    onSave: () => void;
    onClose: () => void;
}

const DiscoverInterestPanel: React.FC<DiscoverInterestPanelProps> = ({ interests, selected, onSelect, onSave, onClose }) => {
    return (
        <div className="bg-dark-secondary rounded-xl border border-dark-200 shadow-lg p-6 w-full max-w-xs flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center mb-2">
                <div className="font-semibold text-white text-lg">Make it yours</div>
                <button onClick={onClose} className="text-white/60 hover:text-white text-lg">×</button>
            </div>
            <div className="text-white/70 text-sm mb-4">Select topics and interests to customize your Discover experience</div>
            
            {/* Selected Interests Section */}
            {selected.length > 0 && (
                <div className="mb-4">
                    <div className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Selected ({selected.length})
                    </div>
                    <div className="flex flex-row flex-wrap gap-2">
                        {selected.map((interest) => (
                            <button
                                key={interest}
                                className="px-3 py-2 rounded-lg bg-[#24A0ED] text-white border border-[#24A0ED] hover:bg-[#1a7fc2] hover:border-[#1a7fc2] transition-all duration-200 flex items-center gap-2 shadow-md"
                                onClick={() => onSelect(interest)}
                                type="button"
                            >
                                <Check className="w-3 h-3" />
                                <span className="text-sm font-medium">{interest}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Interests Section */}
            <div>
                <div className="text-white/80 text-sm font-medium mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-400" />
                    Available ({interests.filter(i => !selected.includes(i)).length})
                </div>
                <div className="flex flex-row flex-wrap gap-2">
                    {interests.filter(interest => !selected.includes(interest)).map((interest) => (
                        <button
                            key={interest}
                            className="px-3 py-2 rounded-lg bg-dark-200 text-white/70 border border-dark-300 hover:bg-[#24A0ED]/20 hover:text-white hover:border-[#24A0ED]/40 transition-all duration-200 flex items-center gap-2"
                            onClick={() => onSelect(interest)}
                            type="button"
                        >
                            <Plus className="w-3 h-3" />
                            <span className="text-sm font-medium">{interest}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="w-full py-3 rounded-lg bg-[#24A0ED] text-white font-semibold text-base hover:bg-[#1a7fc2] transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onSave}
                disabled={selected.length === 0}
            >
                {selected.length > 0 ? `Save ${selected.length} Interest${selected.length > 1 ? 's' : ''}` : 'Select at least one interest'}
            </button>
        </div>
    );
};

export default DiscoverInterestPanel; 