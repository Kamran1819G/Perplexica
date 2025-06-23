import React from 'react';

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
            <div className="text-white/70 text-sm mb-2">Select topics and interests to customize your Discover experience</div>
            <div className="flex flex-row flex-wrap gap-2 mb-4">
                {interests.map((interest) => (
                    <button
                        key={interest}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition ${selected.includes(interest)
                            ? 'bg-[#24A0ED] text-white border-[#24A0ED]'
                            : 'bg-dark-200 text-white/70 border-dark-200 hover:bg-[#24A0ED]/20 hover:text-white'}`}
                        onClick={() => onSelect(interest)}
                        type="button"
                    >
                        {interest}
                    </button>
                ))}
            </div>
            <button
                className="w-full py-2 rounded-lg bg-[#24A0ED] text-white font-semibold text-base hover:bg-[#1a7fc2] transition"
                onClick={onSave}
            >
                Save Interests
            </button>
        </div>
    );
};

export default DiscoverInterestPanel; 