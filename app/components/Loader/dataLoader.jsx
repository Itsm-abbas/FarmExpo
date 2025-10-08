import React from "react";

const DataLoader = () => {
  return (
    <div className="w-full min-h-40 flex justify-center items-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin border-r-primary/50"></div>
      </div>
    </div>
  );
};

export default DataLoader;
