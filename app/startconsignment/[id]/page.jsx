"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ConsigneeForm from "@components/Forms/StartConsignment/Consignee";
import TraderForm from "@components/Forms/StartConsignment/Trader";
import AirwayBill from "@components/Forms/StartConsignment/AirwayBill";
import CustomClearence from "@forms/StartConsignment/CustomClearance";
import Packing from "@components/Forms/StartConsignment/Packing";
import RecoveryDoneForm from "@components/Forms/StartConsignment/RecoveryDone";
import {
  FaArrowRight,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaLock,
} from "react-icons/fa";
import GoodsDeclarationForm from "@forms/StartConsignment/GoodsDeclaration";
import font from "@utils/fonts";
import Link from "next/link";
import DamageForm from "@components/Forms/StartConsignment/Damage";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@utils/axiosConfig";
import Swal from "sweetalert2";
import DailyExpenses from "@components/Forms/StartConsignment/DailyExpenses";

const formsData = [
  { id: 1, name: "Trader", component: TraderForm, key: "trader" },
  { id: 2, name: "Consignee", component: ConsigneeForm, key: "consignee" },
  {
    id: 3,
    name: "Airway Bill/Seaway Bill",
    component: AirwayBill,
    key: "airwayBill",
  },
  {
    id: 4,
    name: "Goods Declaration",
    component: GoodsDeclarationForm,
    key: "goodsDeclaration",
  },
  {
    id: 5,
    name: "Custom Clearance",
    component: CustomClearence,
    key: "customClearance",
  },
  { id: 6, name: "Packing", component: Packing, key: "packing" },
  {
    id: 9,
    name: "Daily Expenses",
    component: DailyExpenses,
    key: "dailyExpenses",
  },
  // {
  //   id: 9,
  //   name: "Packaging",
  //   component: PackagingForm,
  //   key: "goods/packaging",
  // },
  {
    id: 7,
    name: "Recovery",
    component: RecoveryDoneForm,
    key: "recoveryDone",
  },
  {
    id: 8,
    name: "Damage",
    component: DamageForm,
    key: "goods/damage",
  },
];

export default function StartConsignmentPage() {
  const params = useParams();
  const consignmentId = params.id;
  const [formStatuses, setFormStatuses] = useState({});
  const [activeAccordion, setActiveAccordion] = useState(null);
  const accordionRefs = useRef({}); // Store refs for each accordion
  const [itemsLength, setItemsLength] = useState(0);
  const [isFulfilled, setIsFulfilled] = useState(false); // Track if status is 'fulfilled'

  const fetchFormStatuses = async () => {
    try {
      const response = await axiosInstance.get(`/consignment/${consignmentId}`);
      const { data } = response;
      setFormStatuses(data);
      setItemsLength(data.goods.length);
      setIsFulfilled(data.status === "Fulfilled"); // Check if status is 'fulfilled'
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  useEffect(() => {
    fetchFormStatuses();
  }, []);

  const toggleAccordion = (id) => {
    // Check if the form is locked (status is 'fulfilled' and form is not Recovery or Damage)
    const form = formsData.find((f) => f.id === id);
    const isLocked =
      isFulfilled && form.key !== "recoveryDone" && form.key !== "goods/damage";

    // If the accordion is already open, minimize it without showing the modal
    if (activeAccordion === id) {
      setActiveAccordion(null);
      return;
    }

    // If the form is locked and the accordion is closed, show the confirmation modal
    if (isLocked && activeAccordion !== id) {
      Swal.fire({
        title: "Are you sure?",
        text: "This consignment is marked as fulfilled. Are you sure you want to edit this?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, edit it!",
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveAccordion(id); // Open the accordion
        }
      });
    } else {
      setActiveAccordion(id); // Open the accordion
    }

    // Scroll the accordion into view
    setTimeout(() => {
      accordionRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300); // Delay allows animation to start before scrolling
  };

  return (
    <div
      className={`${font.lato.className} min-h-screen dark:bg-gray-800 text-LightPText dark:text-DarkPText py-8`}
    >
      <h1 className="text-3xl font-bold text-center mb-8">
        Create Consignment
      </h1>

      <div className="flex flex-col gap-5">
        <div className="flex justify-center">
          {/* Consignment items */}
          <Link href={`/items-selection/${consignmentId}`}>
            <button
              className={`px-6 py-3 rounded-lg text-white capitalize font-medium transition-all duration-300 ${
                itemsLength > 0
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-SecondaryButton hover:bg-SecondaryButtonHover"
              }`}
            >
              {itemsLength > 0
                ? "Click to update consignment items"
                : "Click to add consignment items"}
            </button>
          </Link>
        </div>
        {/* Accordion */}
        {formsData.map((form) => {
          const FormComponent = form.component;
          const isSubmitted =
            form.key === "goods/packaging"
              ? formStatuses.goods?.some((item) => item?.packaging)
              : form.key === "goods/damage"
              ? formStatuses.goods?.some((item) => item?.damage)
              : formStatuses[form.key];

          // Check if the form is locked
          const isLocked =
            isFulfilled &&
            form.key !== "recoveryDone" &&
            form.key !== "goods/damage";

          return (
            <div
              key={form.id}
              ref={(el) => (accordionRefs.current[form.id] = el)} // Assign ref for scrolling
              className="rounded-lg"
            >
              <div
                className={`rounded-lg p-4 cursor-pointer flex justify-between items-center ${
                  isSubmitted
                    ? "bg-[#D1FAE5] text-[#065F46] border-[#10B981] border-2"
                    : activeAccordion === form.id
                    ? "bg-gray-300 dark:bg-gray-700"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
                onClick={() => toggleAccordion(form.id)}
              >
                <h2 className="text-lg flex items-center">
                  {isSubmitted ? (
                    <>
                      <span className="line-through mr-4 text-sm text-gray-600">
                        Add {form.name}
                      </span>
                      <span className="text-sm md:text-lg">Submitted</span>
                    </>
                  ) : (
                    <p>Add {form.name}</p>
                  )}
                  <span className="ml-2 text-sm md:text-lg">
                    {isSubmitted != null && isSubmitted != 0 && <FaCheck />}
                  </span>
                </h2>
                <span className="text-sm">
                  {activeAccordion === form.id ? (
                    <div className="flex gap-1 items-center">
                      <span>Minimize</span>
                      <FaChevronUp />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      {isLocked ? (
                        <span className="flex items-center justify-center ">
                          Locked
                          <FaLock className="ml-2" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {isSubmitted ? "Click to Edit" : "Expand"}{" "}
                          <FaChevronDown />
                        </span>
                      )}
                    </div>
                  )}
                </span>
              </div>
              <AnimatePresence>
                {activeAccordion === form.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 bg-white dark:bg-[#2d3748] text-[#e5e7eb] flex items-center justify-center overflow-hidden"
                  >
                    <FormComponent
                      consignmentId={consignmentId}
                      existingData={isSubmitted || null}
                      setFormStatuses={setFormStatuses}
                      setActiveAccordion={setActiveAccordion}
                      formStatus={formStatuses}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        <div className="flex justify-end mt-4">
          <Link href={`/invoice/${consignmentId}`}>
            <button className="px-4 py-2 flex items-center gap-2 bg-purple-600 text-white font-semibold rounded-sm shadow-md hover:bg-purple-700 transition">
              Generate Invoice <FaArrowRight />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
