"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import fonts from "@utils/fonts";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next/client";
export default function ConsignmentItemForm({ consignmentId }) {
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Extract the ID from query params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const token = getCookie("token");
  const [formData, setFormData] = useState({
    item: null,
    packaging: null,
    weightPerUnit: "",
    commodityPerUnitCost: "",
    packagingPerUnitCost: "",
    quantity: "",
    damage: "",
  });

  const [items, setItems] = useState([]);
  const [packaging, setPackaging] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePackagingChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-packaging") {
      router.push("/consignment/packaging/add-packaging");
    } else {
      const selectedPackaging = packaging.find(
        (pack) => pack.id === parseInt(selectedId)
      );
      setFormData({ ...formData, packaging: selectedPackaging });
    }
  };

  const handleItemChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "add-new-item") {
      router.push("commodity/add-commodity");
    } else {
      const selectedItem = items.find(
        (item) => item.id === parseInt(selectedId)
      );
      setFormData({ ...formData, item: selectedItem });
    }
  };
  useEffect(() => {
    if (id) {
      // Fetch the existing consingee data
      const fetchConsignmentItem = async () => {
        try {
          const response = await axiosInstance.get(`/consignmentitem/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch consignmentitem details.",
          });
        }
      };
      fetchConsignmentItem();
    }
  }, [id]);
  // Fetch items and packaging data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsResponse, packagingResponse] = await Promise.all([
          fetch(`${apiUrl}/commodity`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${apiUrl}/packaging`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const itemsData = await itemsResponse.json();
        const packagingData = await packagingResponse.json();

        setItems(itemsData);
        setPackaging(packagingData);
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch items or packaging data.",
        });
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async () => {
    // Validation to ensure all fields are filled
    // if (
    //   !formData.item ||
    //   !formData.packaging ||
    //   !formData.weightPerUnit ||
    //   !formData.commodityPerUnitCost ||
    //   !formData.packagingPerUnitCost ||
    //   !formData.quantity ||
    //   !formData.damage
    // ) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "Please fill in all fields.",
    //   });
    //   return;
    // }

    // Prepare payload to send
    const payload = {
      item: formData.item,
      packaging: formData.packaging,
      weightPerUnit: formData.weightPerUnit,
      commodityPerUnitCost: formData.commodityPerUnitCost,
      packagingPerUnitCost: formData.packagingPerUnitCost,
      quantity: formData.quantity,
      damage: formData.damage,
      consignmentId: Number(consignmentId), // ✅ ADD THIS
    };

    setIsLoading(true);

    try {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `${apiUrl}/consignmentitem/${id}`
        : `${apiUrl}/consignmentitem`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const result = await Swal.fire({
        icon: "success",
        title: "Success",
        text: id
          ? "consignmentitem updated successfully."
          : "consignmentitem added successfully.",
      });
      if (response.ok) {
        setFormData({
          item: null,
          packaging: null,
          weightPerUnit: "",
          commodityPerUnitCost: "",
          packagingPerUnitCost: "",
          quantity: "",
          damage: "",
        }); // Clear form for new entry
      }
      if (result.isConfirmed) {
        router.push("view-consignmentitem");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving the consignment item.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${fonts.poppins.className} space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2`}
    >
      <div className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-8">Add Consignment Item</h2>

        {/* Item Dropdown */}
        <div>
          <select
            id="item"
            value={formData.item?.id || ""}
            onChange={handleItemChange}
            className="bg-LightPBg text-black dark:text-white mb-7 mt-1 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
          >
            <option value="">Select an Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
            <option
              value="add-new-item"
              className="text-green-600 font-semibold cursor-pointer"
            >
              + Add New Item
            </option>
          </select>
        </div>

        {/* Packaging Dropdown */}
        <div>
          <select
            id="packaging"
            value={formData.packaging?.id || ""}
            onChange={handlePackagingChange}
            className="bg-LightPBg text-black dark:text-white mb-4 block w-full border border-LightBorder dark:border-DarkBorder dark:bg-[#2d3748] rounded-md p-2 focus:ring-PrimaryButton focus:border-PrimaryButton dark:focus:ring-PrimaryButton dark:focus:border-PrimaryButton outline-none"
          >
            <option value="">Select Packaging</option>
            {packaging.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.name}
              </option>
            ))}
            <option
              value="add-new-packaging"
              className="text-green-600 font-semibold cursor-pointer"
            >
              + Add New Packaging
            </option>
          </select>
        </div>

        {/* Other Inputs */}
        <Input
          id="weightPerUnit"
          type="number"
          label="Weight Per Unit"
          placeholder="Enter weight per unit"
          value={formData.weightPerUnit}
          onChange={(e) =>
            setFormData({ ...formData, weightPerUnit: e.target.value })
          }
        />
        <Input
          id="commodityPerUnitCost"
          type="number"
          label="Commodity Per Unit Cost"
          placeholder="Enter commodity per unit cost"
          value={formData.commodityPerUnitCost}
          onChange={(e) =>
            setFormData({ ...formData, commodityPerUnitCost: e.target.value })
          }
        />
        <Input
          id="packagingPerUnitCost"
          type="number"
          label="Packaging Per Unit Cost"
          placeholder="Enter packaging per unit cost"
          value={formData.packagingPerUnitCost}
          onChange={(e) =>
            setFormData({ ...formData, packagingPerUnitCost: e.target.value })
          }
        />
        <Input
          id="quantity"
          type="number"
          label="Quantity"
          placeholder="Enter quantity"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
        />
        <Input
          id="damage"
          type="number"
          label="Damage"
          placeholder="Enter damage"
          value={formData.damage}
          onChange={(e) => setFormData({ ...formData, damage: e.target.value })}
        />

        {/* Save Button */}
        <SaveButton handleSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
