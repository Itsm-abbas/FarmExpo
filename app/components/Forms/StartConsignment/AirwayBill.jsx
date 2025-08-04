"use client";
import UpdateConsignment from "@utils/updateConsignment";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { motion } from "framer-motion";
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { fetchIata } from "@constants/consignmentAPI";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
const MySwal = withReactContent(Swal);
export default function AirwayBill({
  consignmentId,
  existingData,
  setFormStatuses,
  setActiveAccordion,
}) {
  const token = getCookie("token");
  const router = useRouter();
  const { data: iataAgentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["IataAgents"],
    queryFn: fetchIata,
  });
  const [Billnumber, setBillNumber] = useState("");
  const [rate, setRate] = useState("");
  const [airwayBillWeight, setAirwayBillWeight] = useState("");
  const [fee, setFee] = useState("");

  // Date picker
  const [date, setDate] = useState(new Date());
  const [formattedDate, setFormattedDate] = useState("");

  // Selecting IATA Agent
  const [selectedIataAgent, setSelectedIataAgent] = useState(""); // Selected IATA Agent
  const [showDropdown, setShowDropdown] = useState(false); // Toggle dropdown visibility
  const [submitLoading, setIsSubmitLoading] = useState(false); // Loading state for API call
  const [error, setError] = useState(""); // Error state for API call

  const onChangeDate = (e) => {
    const selectedDate = new Date(e.target.value);
    setDate(selectedDate);
    setFormattedDate(selectedDate.toISOString().split("T")[0]);
  };
  // // When an agent is selected
  // const handleSelectAgent = (agentDetail) => {
  //   setSelectedAgent(agentDetail);
  //   setShowDropdown(false); // Close dropdown
  // };
  // Save Data

  const handleSubmit = async () => {
    if (
      !Billnumber ||
      !fee ||
      !rate ||
      !airwayBillWeight ||
      selectedIataAgent === null
    ) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please fill in all the fields.",
      });
      return;
    }
    if (existingData) {
      if (
        Billnumber === existingData.number &&
        selectedIataAgent?.name === existingData?.iataAgent.name &&
        rate === existingData.rate &&
        airwayBillWeight === existingData.airwayBillWeight &&
        fee === existingData.fee
      ) {
        MySwal.fire({
          icon: "error",
          title: "Same data",
          text: "Please make changes to update the data.",
        });
        return;
      } // Check if there are changes in existing data - if not, return
    }
    setIsSubmitLoading(true);
    try {
      const payload = {
        number: Billnumber,
        iataAgent: selectedIataAgent, // Pass the selected agent
        dateTime: moment(date).format("YYYY-MM-DDTHH:mm:ss"),
        rate,
        airwayBillWeight,
        fee,
      };
      const url = existingData
        ? `/api/airwaybill/${existingData?.id}`
        : `/api/airwaybill`;
      const method = existingData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const { id } = await response.json();

      if (!existingData) {
        await UpdateConsignment(consignmentId, {
          airwayBill: { id, ...payload },
        });
      }
      // if (!existingData) {
      //   await UpdateConsignment(consignmentId, {
      //     airwayBill: { id, ...payload },
      //   });
      // } else {
      //   await UpdateConsignment(
      //     consignmentId,
      //     { airwayBill: { id, ...payload } },
      //     "Airway Bill"
      //   );
      // }
      setFormStatuses((prev) => ({
        ...prev,
        airwayBill: { id, ...payload },
      }));
      setActiveAccordion(null);
      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      MySwal.fire({
        icon: "success",
        title: "Success",
        showConfirmButton: false,
        timer: 1500,
        text: existingData
          ? "Airway bill updated successfully!"
          : "Airway bill added successfully!",
      });

      if (!existingData) {
        // Clear form for new data
        setBillNumber("");
        setRate("");
        setAirwayBillWeight("");
        setFee("");
        setSelectedIataAgent("");
        setFormattedDate("");
      }
    } catch (error) {
      setIsSubmitLoading(false);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
      });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (existingData) {
      setBillNumber(existingData.number || "");
      setRate(existingData.rate || "");
      setAirwayBillWeight(existingData.airwayBillWeight || "");
      setFee(existingData.fee || "");
      setSelectedIataAgent(existingData.iataAgent || null);
      setFormattedDate(
        existingData.dateTime
          ? moment(existingData.dateTime).format("YYYY-MM-DD")
          : ""
      );
    }
  }, [existingData]);

  const handleIataagentsChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-iataagent") {
      router.push("/consignment/iata-agent/add-iataAgent");
    } else {
      const c = iataAgentsData.find((t) => t.id === parseInt(selectedId));
      setSelectedIataAgent(c);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2"
    >
      <motion.div
        className=" shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-8">Airway/Seaway Bill</h2>
        {/* Number */}
        <Input
          id="Billnumber"
          type="text"
          value={Billnumber}
          onChange={(e) => setBillNumber(e.target.value)}
          placeholder="Enter Airway/Seaway Bill Number"
          label="Airway/Seaway Bill Number*"
        />

        {/* IATA Agent Dropdown */}

        <div className="relative">
          {isLoadingAgents ? (
            <motion.p
              className="text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              Fetching IATA agents...
            </motion.p>
          ) : (
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.select
                id="iataagents"
                value={selectedIataAgent?.id || ""}
                onChange={handleIataagentsChange}
                className="bg-LightPBg text-black dark:text-white mb-7  block w-full border border-LightBorder dark:border-DarkBorder dark:bg-DarkInput rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none relative z-30 mt-7"
                whileFocus={{ scale: 1.02 }}
              >
                <option value="">Select IATA Agent</option>
                {iataAgentsData.map((iataagent) => (
                  <option key={iataagent.id} value={iataagent.id}>
                    {iataagent.vendor.name}
                  </option>
                ))}
                <option
                  value="add-new-iataagent"
                  className="text-green-600 capitalize font-semibold cursor-pointer"
                >
                  + Add New IATA Agent
                </option>
              </motion.select>
            </motion.div>
          )}
        </div>
        {/* Date Picker */}

        <Input
          id="date"
          type="date"
          name="Date*"
          value={formattedDate}
          onChange={onChangeDate}
          label="Date*"
        />

        {/* Rate */}
        <Input
          id="rate"
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder="Enter Rate"
          label="Rate*"
        />

        {/* Airway Bill Weight */}
        <Input
          id="airwayBillWeight"
          type="number"
          value={airwayBillWeight}
          onChange={(e) => setAirwayBillWeight(e.target.value)}
          placeholder="Enter Airway/Seaway Bill Weight"
          label="Airway/Seaway Bill Weight*"
        />
        {/* Fee */}
        <Input
          id="fee"
          type="number"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Enter Fee"
          label="Fee*"
        />

        {/* Save Button */}
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={submitLoading}
          existingData={existingData}
          classes=""
        />
      </motion.div>
    </motion.div>
  );
}
