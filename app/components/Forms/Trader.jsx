//components/Forms/Trader.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import { FaEye } from "react-icons/fa";
import { getCookie } from "cookies-next";
import axiosInstance from "@utils/axiosConfig";

export default function TraderForm() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Extract the ID from query params
  const [formData, setFormData] = useState({
    ntn: "",
    name: "",
    address: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch the existing Trader data
      const fetchTrader = async () => {
        try {
          const response = await axiosInstance.get(`/trader/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch Trader details.",
          });
        }
      };
      fetchTrader();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (
      !formData.ntn ||
      !formData.name ||
      !formData.address ||
      !formData.country
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all the fields.",
      });
      return;
    }

    setLoading(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/trader/${id}` : `/api/trader`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the token in the request headers
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      if (response.ok) {
        Swal.fire({
          position: "top-center",
          icon: "success",
          title: id ? "Updated successfully." : "Added successfully.",
          showConfirmButton: false,
          timer: 1500,
        });
        if (!id) setFormData({ ntn: "", name: "", address: "", country: "" }); // Clear form for new entry
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving data.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-8">
          {id ? "Edit Trader" : "Add Trader"}
        </h2>
        <div>
          <Input
            id={"ntn"}
            type="text"
            value={formData.ntn}
            onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
            placeholder="Enter NTN"
            label={"NTN*"}
          />
        </div>
        <div>
          <Input
            id={"name"}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter name"
            label={"Name*"}
          />
        </div>
        <div>
          <Input
            id={"address"}
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Enter address"
            label={"Address*"}
          />
        </div>
        <div>
          <Input
            id={"country"}
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            placeholder="Enter country"
            label={"Country*"}
          />
        </div>
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={loading}
          existingData={id ? true : false}
        />
      </div>
      <LinkButton
        href="/consignment/trader/view-trader"
        title="See your traders"
        icon={FaEye}
        desc="Click to view your existing traders"
      />
    </div>
  );
}
