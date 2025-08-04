"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Input from "@components/Input";
import { getCookie } from "cookies-next";

const MySwal = withReactContent(Swal);

export default function DamageForm({
  consignmentId,
  setFormStatuses,
  setActiveAccordion,
}) {
  const token = getCookie("token");
  const [loadingStates, setLoadingStates] = useState({});
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchConsignmentData = async () => {
      try {
        const response = await fetch(`/api/consignment/${consignmentId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch consignment data.");
        const data = await response.json();
        setItems(data.goods || []);
        setFormData(
          (data.goods || []).reduce((acc, item) => {
            acc[item.id] = item.damage ?? "";
            return acc;
          }, {})
        );
      } catch (error) {
        Swal.fire({ icon: "error", title: "Error", text: error.message });
      }
    };

    fetchConsignmentData();
  }, [consignmentId]);

  const handleSubmit = async (itemId) => {
    const damage = parseFloat(formData[itemId]);
    if (isNaN(damage)) {
      MySwal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please enter a valid damage quantity.",
      });
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [itemId]: true }));

    try {
      const targetItem = items.find((item) => item.id === itemId);
      if (!targetItem) throw new Error("Item not found.");

      const updatedItem = {
        ...targetItem,
        damage,
      };

      const response = await fetch(`/api/consignmentitem/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedItem),
      });

      if (!response.ok) throw new Error("Failed to update consignment item.");

      const updatedItems = items.map((item) =>
        item.id === itemId ? { ...item, damage } : item
      );

      setItems(updatedItems);
      setFormStatuses((prev) => ({ ...prev, goods: updatedItems }));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Damage updated successfully!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to update damage.",
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      {items.map((item) => (
        <div
          key={item.id}
          className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2"
        >
          <div>
            <h2 className="text-xl font-semibold mb-8 capitalize">
              {item.commodityItem?.name || "Unnamed Item"}
            </h2>

            <Input
              type="number"
              id={`damage-${item.id}`}
              label="Damage"
              value={formData[item.id]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [item.id]: e.target.value,
                }))
              }
              placeholder="Enter damaged quantity"
            />
          </div>

          <button
            onClick={() => handleSubmit(item.id)}
            className={`uppercase w-full px-4 py-2 rounded-md text-white transition-all duration-200 ${
              loadingStates[item.id]
                ? "bg-[#A7F3D0] cursor-not-allowed"
                : "bg-PrimaryButton hover:bg-PrimaryButtonHover"
            }`}
            disabled={loadingStates[item.id]}
          >
            {loadingStates[item.id] ? "Saving..." : "Save"}
          </button>
        </div>
      ))}
    </div>
  );
}
