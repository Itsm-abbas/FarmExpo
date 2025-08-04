import fonts from "@utils/fonts";
import React from "react";

const SaveButton = ({ handleSubmit, isLoading, existingData }) => {
  return (
    <button
      onClick={handleSubmit}
      className={`${
        isLoading
          ? "bg-[#A7F3D0]"
          : `${
              existingData
                ? "bg-SecondaryButton hover:bg-SecondaryButtonHover"
                : "bg-PrimaryButton hover:bg-PrimaryButtonHover"
            }`
      } uppercase w-full px-4 py-2 rounded-md text-white ${
        fonts.poppins.className
      }`}
      disabled={isLoading}
    >
      {isLoading ? "Saving..." : existingData ? "Update" : "Save"}
    </button>
  );
};

export default SaveButton;
