import React from 'react';
import type { SkuAnalysisResult } from '../types.js';
import SkuCard from './SkuCard.js';

interface AdsDashboardProps {
    data: SkuAnalysisResult[];
}

const AdsDashboard: React.FC<AdsDashboardProps> = ({ data }) => {
    return (
        <div className="w-full h-full">
           <SkuCard data={data} />
        </div>
    );
};

export default AdsDashboard;