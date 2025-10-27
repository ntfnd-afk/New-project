import React from 'react';
import SkuCard from './SkuCard.js';

const AdsDashboard = ({ data }) => {
    return (
        <div className="w-full h-full">
           <SkuCard data={data} />
        </div>
    );
};

export default AdsDashboard;