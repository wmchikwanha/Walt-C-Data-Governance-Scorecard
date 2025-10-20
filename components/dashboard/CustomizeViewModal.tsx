import React, { useState, useEffect } from 'react';
import { Dimension } from '../../types';
import Modal from '../shared/Modal';

interface CustomizeViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    allDimensions: Dimension[];
    visibleDimensions: string[];
    onSave: (newVisibleDimensions: string[]) => void;
}

const CustomizeViewModal: React.FC<CustomizeViewModalProps> = ({ isOpen, onClose, allDimensions, visibleDimensions, onSave }) => {
    const [selected, setSelected] = useState<string[]>(visibleDimensions);

    useEffect(() => {
        if (isOpen) {
            setSelected(visibleDimensions);
        }
    }, [isOpen, visibleDimensions]);

    const handleToggle = (dimensionName: string) => {
        setSelected(prev => 
            prev.includes(dimensionName) 
                ? prev.filter(d => d !== dimensionName) 
                : [...prev, dimensionName]
        );
    };

    const handleSelectAll = () => {
        setSelected(allDimensions.map(d => d.name));
    };

    const handleDeselectAll = () => {
        setSelected([]);
    };

    const handleSave = () => {
        onSave(selected);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard View">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Select the dimension columns you want to see in the heatmap.</p>
                <div className="flex justify-between items-center pb-2 border-b">
                    <div className="text-sm font-semibold text-gray-800">{selected.length} of {allDimensions.length} selected</div>
                    <div className="space-x-2">
                        <button onClick={handleSelectAll} className="text-sm font-semibold text-brand-primary hover:underline">Select All</button>
                        <button onClick={handleDeselectAll} className="text-sm font-semibold text-brand-primary hover:underline">Deselect All</button>
                    </div>
                </div>

                <div className="max-h-60 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {allDimensions.map(dim => (
                        <label key={dim.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selected.includes(dim.name)}
                                onChange={() => handleToggle(dim.name)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary"
                            />
                            <span className="text-sm text-gray-700">{dim.name}</span>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-secondary">
                        Save View
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CustomizeViewModal;
