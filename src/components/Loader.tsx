import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="relative flex justify-center items-center">
      <div className="absolute animate-ping w-8 h-8 rounded-full bg-[#376497]/50 opacity-75"></div>
      <div className="relative w-8 h-8 rounded-full bg-[#376497] animate-pulse"></div>
    </div>
  );
};

export default Loader;