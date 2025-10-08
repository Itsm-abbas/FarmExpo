// app/startconsignment/[id]/page.jsx

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
  FaFileInvoice,
  FaBox,
  FaShippingFast,
  FaClipboardCheck,
  FaDollarSign,
  FaExclamationTriangle,
  FaReceipt,
} from "react-icons/fa";
import GoodsDeclarationForm from "@forms/StartConsignment/GoodsDeclaration";
import Link from "next/link";
import DamageForm from "@components/Forms/StartConsignment/Damage";
import { motion, AnimatePresence } from "framer-motion";
import axiosInstance from "@utils/axiosConfig";
import Swal from "sweetalert2";
import DailyExpenses from "@components/Forms/StartConsignment/DailyExpenses";

const formsData = [
  {
    id: 1,
    name: "Trader",
    component: TraderForm,
    key: "trader",
    icon: FaReceipt,
    description: "Add trading partner details and information",
  },
  {
    id: 2,
    name: "Consignee",
    component: ConsigneeForm,
    key: "consignee",
    icon: FaShippingFast,
    description: "Enter consignee information and destination details",
  },
  {
    id: 3,
    name: "Airway Bill",
    component: AirwayBill,
    key: "airwayBill",
    icon: FaClipboardCheck,
    description: "Add airway bill or seaway bill details",
  },
  {
    id: 4,
    name: "Goods Declaration",
    component: GoodsDeclarationForm,
    key: "goodsDeclaration",
    icon: FaBox,
    description: "Declare goods and commercial invoice information",
  },
  {
    id: 5,
    name: "Custom Clearance",
    component: CustomClearence,
    key: "customClearance",
    icon: FaClipboardCheck,
    description: "Custom clearance and documentation details",
  },
  {
    id: 6,
    name: "Packing",
    component: Packing,
    key: "packing",
    icon: FaBox,
    description: "Packing details and specifications",
  },
  {
    id: 9,
    name: "Daily Expenses",
    component: DailyExpenses,
    key: "dailyExpenses",
    icon: FaDollarSign,
    description: "Record daily operational expenses",
  },
  {
    id: 7,
    name: "Recovery",
    component: RecoveryDoneForm,
    key: "recoveryDone",
    icon: FaDollarSign,
    description: "Payment recovery and financial settlements",
  },
  {
    id: 8,
    name: "Damage",
    component: DamageForm,
    key: "goods/damage",
    icon: FaExclamationTriangle,
    description: "Report damaged goods and losses",
  },
];

export default function StartConsignmentPage() {
  const params = useParams();
  const consignmentId = params.id;
  const [formStatuses, setFormStatuses] = useState({});
  const [activeAccordion, setActiveAccordion] = useState(null);
  const accordionRefs = useRef({});
  const [itemsLength, setItemsLength] = useState(0);
  const [isFulfilled, setIsFulfilled] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchFormStatuses = async () => {
    try {
      const response = await axiosInstance.get(`/consignment/${consignmentId}`);
      const { data } = response;
      setFormStatuses(data);
      setItemsLength(data.goods?.length || 0);
      setIsFulfilled(data.status === "Fulfilled");

      // Calculate progress
      const completedForms = formsData.filter((form) => {
        if (form.key === "goods/packaging") {
          return data.goods?.some((item) => item?.packaging);
        }
        if (form.key === "goods/damage") {
          return data.goods?.some((item) => item?.damage);
        }
        return data[form.key];
      }).length;

      setProgress(Math.round((completedForms / formsData.length) * 100));
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  useEffect(() => {
    fetchFormStatuses();
  }, []);

  const toggleAccordion = (id) => {
    const form = formsData.find((f) => f.id === id);
    const isLocked =
      isFulfilled && form.key !== "recoveryDone" && form.key !== "goods/damage";

    if (activeAccordion === id) {
      setActiveAccordion(null);
      return;
    }

    if (isLocked && activeAccordion !== id) {
      Swal.fire({
        title: "Consignment Locked",
        text: "This consignment is marked as fulfilled. Editing completed forms may affect financial records.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "rgb(var(--color-primary))",
        cancelButtonColor: "rgb(var(--color-accent))",
        confirmButtonText: "Continue Editing",
        cancelButtonText: "Cancel",
        background: "rgb(var(--color-background))",
        color: "rgb(var(--color-text))",
      }).then((result) => {
        if (result.isConfirmed) {
          setActiveAccordion(id);
          setTimeout(() => {
            accordionRefs.current[id]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 300);
        }
      });
    } else {
      setActiveAccordion(id);
      setTimeout(() => {
        accordionRefs.current[id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  };

  const getFormStatus = (formKey) => {
    if (formKey === "goods/packaging") {
      return formStatuses.goods?.some((item) => item?.packaging);
    }
    if (formKey === "goods/damage") {
      return formStatuses.goods?.some((item) => item?.damage);
    }
    return formStatuses[formKey];
  };

  const completedForms = formsData.filter((form) =>
    getFormStatus(form.key)
  ).length;
  const totalForms = formsData.length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold font-poppins text-text">
            Create Consignment
          </h1>
          <p className="text-text/70 font-inter text-lg">
            Complete all sections to finalize your consignment
          </p>
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-background rounded-2xl border border-primary/20 shadow-lg p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <h3 className="text-xl font-semibold font-poppins text-text">
                Consignment Progress
              </h3>
              <p className="text-text/70 font-inter">
                {completedForms} of {totalForms} sections completed
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={`/items-selection/${consignmentId}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-poppins font-medium transition-all duration-300 ${
                    itemsLength > 0
                      ? "bg-primary text-white hover:bg-primary/90 shadow-lg"
                      : "bg-accent text-white hover:bg-accent/90 shadow-lg"
                  }`}
                >
                  <FaBox className="text-sm" />
                  {itemsLength > 0
                    ? "Update Consignment Items"
                    : "Add Consignment Items"}
                </motion.button>
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm font-inter">
              <span className="text-text/70">Completion Progress</span>
              <span className="text-text font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-primary/20 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-primary h-3 rounded-full shadow-lg"
              />
            </div>
          </div>
        </motion.div>

        {/* Forms Accordion */}
        <div className="space-y-4">
          {formsData.map((form) => {
            const FormComponent = form.component;
            const FormIcon = form.icon;
            const isSubmitted = getFormStatus(form.key);
            const isLocked =
              isFulfilled &&
              form.key !== "recoveryDone" &&
              form.key !== "goods/damage";

            return (
              <motion.div
                key={form.id}
                ref={(el) => (accordionRefs.current[form.id] = el)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: form.id * 0.1 }}
                className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
              >
                {/* Accordion Header */}
                <div
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    isSubmitted
                      ? "bg-primary/10 border-l-4 border-primary"
                      : activeAccordion === form.id
                      ? "bg-primary/5"
                      : "hover:bg-primary/5"
                  } ${isLocked ? "opacity-80" : ""}`}
                  onClick={() => toggleAccordion(form.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-xl ${
                          isSubmitted
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <FormIcon className="text-lg" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold font-poppins text-text flex items-center gap-2">
                          {form.name}
                          {isSubmitted && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
                            >
                              <FaCheck size={10} />
                              Completed
                            </motion.span>
                          )}
                          {isLocked && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <FaLock size={10} />
                              Locked
                            </span>
                          )}
                        </h3>
                        <p className="text-text/70 font-inter text-sm">
                          {form.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {activeAccordion === form.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-primary font-inter text-sm"
                        >
                          <span>Minimize</span>
                          <FaChevronUp className="text-sm" />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-text/70 font-inter text-sm"
                        >
                          {isLocked ? (
                            <span className="flex items-center gap-2 text-red-500">
                              <FaLock className="text-sm" />
                              View Only
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {isSubmitted ? "Edit Section" : "Expand"}
                              <FaChevronDown className="text-sm" />
                            </span>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accordion Content */}
                <AnimatePresence>
                  {activeAccordion === form.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="border-t border-primary/10"
                    >
                      <div className="p-6">
                        <FormComponent
                          consignmentId={consignmentId}
                          existingData={isSubmitted || null}
                          setFormStatuses={setFormStatuses}
                          setActiveAccordion={setActiveAccordion}
                          formStatus={formStatuses}
                          isLocked={isLocked}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Action Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-primary/10"
        >
          <div className="text-text/70 font-inter text-sm">
            Consignment ID:{" "}
            <span className="font-mono text-text">{consignmentId}</span>
          </div>

          <Link href={`/invoice/${consignmentId}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-6 py-3 bg-primary text-white font-poppins font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/90"
            >
              <FaFileInvoice className="text-lg" />
              Generate Invoice
              <FaArrowRight className="text-sm" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
