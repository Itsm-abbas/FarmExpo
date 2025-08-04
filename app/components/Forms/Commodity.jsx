//components/Forms/Commodity.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import LinkButton from "@components/Button/LinkButton";
import { FaEye } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
export default function CommodityForm() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Extract the ID from query params
  const [formData, setFormData] = useState({ name: "", number: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch the existing commodity data
      const fetchCommodity = async () => {
        try {
          const response = await axiosInstance.get(`/commodity/${id}`);
          const { data } = response;
          setFormData(data);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch commodity details.",
          });
        }
      };
      fetchCommodity();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.number) {
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
      const url = id ? `/api/commodity/${id}` : `/api/commodity`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        if (!id) {
          setFormData({ number: "", name: "" });
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-LightPText dark:text-DarkPText w-full md:w-4/5 lg:w-1/2">
      <div className="shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-8">
          {id ? "Edit Commodity" : "Add Commodity"}
        </h2>
        <Input
          id={"number"}
          type="text"
          label="Number"
          placeholder="Enter number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
        />
        <Input
          id={"name"}
          type="text"
          label="Name"
          placeholder="Enter name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={loading}
          existingData={id ? true : false}
        />
      </div>
      <LinkButton
        href="/consignment/commodity/view-commodity"
        title="See your commodities"
        icon={FaEye}
        desc="Click to view your existing commodities"
      />
    </div>
  );
}
