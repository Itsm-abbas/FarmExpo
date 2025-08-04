"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import SaveButton from "@components/Button/SaveButton";
import Input from "@components/Input";
import { useSearchParams } from "next/navigation";
import LinkButton from "@components/Button/LinkButton";
import { FaEye } from "react-icons/fa";
import axiosInstance from "@utils/axiosConfig";
import { getCookie } from "cookies-next";
export default function ConsigneeForm() {
  const token = getCookie("token");
  const searchParams = useSearchParams();
  const id = searchParams.get("id"); // Extract the ID from query params

  const [formData, setFormData] = useState({
    name: "",
    ntn: "",
    address: "",
    country: "",
    station: "",
    balance: 0,
    currency: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch the existing consingee data
      const fetchConsignee = async () => {
        try {
          const response = await axiosInstance.get(`/consignee/${id}`);
          const { data } = response;
          setFormData(data.vendor);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch consignee details.",
          });
        }
      };
      fetchConsignee();
    }
  }, [id]);

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.address ||
      !formData.country ||
      !formData.balance ||
      !formData.currency ||
      !formData.ntn ||
      !formData.station
    ) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please fill in all the fields.",
      });
      return;
    }
    setLoading(true);
    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `/api/consignee/${id}` : `/api/consignee`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
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
          setFormData({
            name: "",
            address: "",
            country: "",
            balance: 0,
            currency: "",
            ntn: "",
            station: "",
          }); // Clear form for new entry
        }
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
      <div className=" shadow-md rounded-md p-6 space-y-4 border-LightBorder dark:border-DarkBorder border-2">
        <h2 className="text-xl font-semibold mb-8">Consignee</h2>
        <div>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter name"
            label="Name*"
          />
        </div>{" "}
        <div>
          <Input
            id="ntn"
            type="text"
            value={formData.ntn}
            onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
            placeholder="Enter ntn"
            label="Ntn*"
          />
        </div>
        <div>
          <Input
            id="address"
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Enter address"
            label="Address*"
          />
        </div>
        <div>
          <Input
            id="country"
            type="text"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            placeholder="Enter country"
            label="Country*"
          />
        </div>{" "}
        <div>
          <Input
            id="station"
            type="text"
            value={formData.station}
            onChange={(e) =>
              setFormData({ ...formData, station: e.target.value })
            }
            placeholder="Enter station"
            label="Station*"
          />
        </div>
        <div>
          <Input
            id="balance"
            type="float"
            min="0"
            value={formData.balance}
            onChange={(e) =>
              setFormData({
                ...formData,
                balance: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="Enter balance"
            label="Balance*"
          />
        </div>
        <div>
          <Input
            id="currency"
            type="text"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            placeholder="Enter currency"
            label="Currency*"
          />
        </div>
        <SaveButton
          handleSubmit={handleSubmit}
          isLoading={loading}
          existingData={id ? true : false}
        />
      </div>
      <LinkButton
        href="/consignment/consignee/view-consignee"
        title="See your consignee"
        icon={FaEye}
        desc="Click to view your existing consignee"
      />
    </div>
  );
}
