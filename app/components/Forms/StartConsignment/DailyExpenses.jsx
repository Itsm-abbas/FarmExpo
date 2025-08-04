"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import UpdateConsignment from "@utils/updateConsignment";
const MySwal = withReactContent(Swal);
const DailyExpenses = ({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) => {
  const [dailyExpenses, setDailyExpenses] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingData) {
      setDailyExpenses(existingData);
    }
  }, [existingData]);

  const handleSubmit = async () => {
    if (!dailyExpenses) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all the fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      await UpdateConsignment(consignmentId, {
        dailyExpenses: dailyExpenses,
      });

      setFormStatuses((prev) => ({
        ...prev,
        dailyExpenses: dailyExpenses,
      }));
      setActiveAccordion(null);
      MySwal.fire({
        icon: "success",
        title: "Success",
        text: "Daily expenses added successfully.",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-4">Daily Expenses</h2>
        <Input
          id="dailyExpenses"
          type="number"
          placeholder="Enter daily expenses"
          value={dailyExpenses}
          onChange={(e) => setDailyExpenses(e.target.value)}
        />
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          existingData={existingData}
        />
      </div>
    </div>
  );
};

export default DailyExpenses;
