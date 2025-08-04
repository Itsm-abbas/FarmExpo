"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import UpdateConsignment from "@utils/updateConsignment";
import { getCookie } from "cookies-next";
const MySwal = withReactContent(Swal);

export default function RecoveryDoneForm({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) {
  const [formData, setFormData] = useState({
    amount: "",
    currency: "",
    exchangeRate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const token = getCookie("token");
  const handleSubmit = async () => {
    if (!formData.amount || !formData.currency || !formData.exchangeRate) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill in all the fields.",
      });
      return;
    }

    if (
      existingData &&
      formData.amount === existingData.amount &&
      formData.currency === existingData.currency &&
      formData.exchangeRate === existingData.exchangeRate
    ) {
      MySwal.fire({
        icon: "info",
        title: "No Changes",
        text: "No updates were made.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const method = existingData ? "PUT" : "POST";
      const url = existingData
        ? `/api/recovery-done/${existingData.id}`
        : `/api/recovery-done`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to save data");

      await UpdateConsignment(
        consignmentId,
        { recoveryDone: { id: result.id, ...formData } },
        "Fulfilled"
      );

      setFormStatuses((prev) => ({
        ...prev,
        recoveryDone: { id: result.id, ...formData },
      }));
      setActiveAccordion(null);

      MySwal.fire({
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: 1500,
        text: existingData
          ? "Recovery updated successfully!"
          : "Recovery added successfully!",
      });

      if (!existingData) {
        setFormData({ amount: "", currency: "", exchangeRate: "" });
      }
    } catch (error) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (existingData) {
      setFormData(existingData); // Pre-fill the form with existing data
    }
  }, [existingData]);
  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className=" shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <div>
          <h2 className="text-xl font-semibold mb-8">Recovery</h2>

          <Input
            type="number"
            id="amount"
            label="Amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="Enter amount"
          />
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            placeholder="Enter currency"
          />
          <Input
            type="number"
            id="exchangeRate"
            value={formData.exchangeRate}
            onChange={(e) =>
              setFormData({ ...formData, exchangeRate: e.target.value })
            }
            placeholder="Enter exchange rate"
          />
        </div>

        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          existingData={existingData}
          classes=""
        />
      </div>
    </div>
  );
}
