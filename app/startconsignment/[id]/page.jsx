// app/startconsignment/[id]/page.jsx

"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  listQueries,
  markConsignmentChanged,
  queryKeys,
  useConsignment,
} from "@hooks/queries";
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
import Swal from "sweetalert2";
import DailyExpenses from "@components/Forms/StartConsignment/DailyExpenses";
import FinancialInstrumentsForm from "@components/Forms/StartConsignment/Fiu";
import TaxesForm from "@components/Forms/StartConsignment/Taxes";
import axiosInstance from "@utils/axiosConfig";
import { FaChartLine, FaPen, FaPercent } from "react-icons/fa";

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
    id: 10,
    name: "Financial Instruments",
    component: FinancialInstrumentsForm,
    key: "utilizations",
    icon: FaChartLine,
    description: "Instruments this consignment uses; the goods declaration takes their currency",
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
    id: 11,
    name: "Taxes",
    component: TaxesForm,
    key: "taxes",
    icon: FaPercent,
    description: "Taxes with remarks, added to the total cost and the invoice",
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

// Shown until the consignment has loaded, in the shape of the page, so no
// empty form can be edited before its saved data arrives.
function ConsignmentSkeleton({ id }) {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 text-text/70">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          Loading consignment #{id}…
        </div>
        <div className="animate-pulse space-y-4" aria-hidden="true">
          <div className="space-y-4 rounded-2xl border border-text/10 bg-surface p-6">
            <div className="h-5 w-48 rounded bg-text/10" />
            <div className="h-3 w-40 rounded bg-text/[0.07]" />
            <div className="h-3 w-full rounded-full bg-text/[0.07]" />
          </div>
          {formsData.map((form) => (
            <div key={form.id} className="flex items-center gap-4 rounded-2xl border border-text/10 bg-surface p-6">
              <div className="h-11 w-11 rounded-xl bg-text/10" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-text/10" />
                <div className="h-3 w-64 rounded bg-text/[0.07]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StartConsignmentPage() {
  const params = useParams();
  const consignmentId = params.id;
  const queryClient = useQueryClient();
  const [activeAccordion, setActiveAccordion] = useState(null);
  const accordionRefs = useRef({});

  // The consignment lives in the shared cache, so the items page and the
  // invoice use the same copy and see every save.
  const {
    data: consignment,
    isFetching,
    isError,
    refetch,
  } = useConsignment(consignmentId);
  const formStatuses = consignment || {};
  const itemsLength = formStatuses.goods?.length || 0;
  const isFulfilled = formStatuses.status === "Fulfilled";
  // Sections open only once the latest data is in, so nothing loads into a
  // form after someone has started typing.
  const ready = Boolean(consignment) && !isFetching;

  const setFormStatuses = useCallback(
    (update) => {
      queryClient.setQueryData(queryKeys.consignment(consignmentId), (prev) =>
        typeof update === "function" ? update(prev || {}) : update
      );
      markConsignmentChanged(queryClient, consignmentId);
    },
    [queryClient, consignmentId]
  );

  // The consignment number, entered by the user; editable from the header.
  const [numberDraft, setNumberDraft] = useState(null);
  const [numberError, setNumberError] = useState("");
  const [savingNumber, setSavingNumber] = useState(false);
  const displayNumber = formStatuses.number || `#${consignmentId}`;
  const saveNumber = async (e) => {
    e.preventDefault();
    if (!numberDraft?.trim()) return setNumberError("Enter the consignment number.");
    setSavingNumber(true);
    setNumberError("");
    try {
      const { data } = await axiosInstance.put(`/consignment/${consignmentId}`, {
        number: numberDraft.trim(),
      });
      setFormStatuses(() => data);
      setNumberDraft(null);
    } catch (error) {
      setNumberError(error.message);
    } finally {
      setSavingNumber(false);
    }
  };

  // Load every list the sections choose from in parallel, up front.
  useEffect(() => {
    Object.values(listQueries).forEach((query) => queryClient.prefetchQuery(query));
  }, [queryClient]);

  const toggleAccordion = (id) => {
    if (!ready) return;
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
    // Lists count as done once they have an entry.
    if (formKey === "utilizations" || formKey === "taxes") {
      return Array.isArray(formStatuses[formKey]) && formStatuses[formKey].length > 0;
    }
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
  // Derived, so the bar moves as soon as a section is saved.
  const progress = Math.round((completedForms / totalForms) * 100);

  if (!consignment) {
    if (isError) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-semibold text-text">
            Couldn&apos;t load consignment #{consignmentId}
          </h1>
          <p className="mt-2 text-text/65">
            Check your connection and try again. If it keeps failing, it may
            have been deleted.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent"
          >
            Try again
          </button>
        </div>
      );
    }
    return <ConsignmentSkeleton id={consignmentId} />;
  }

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
          {numberDraft === null ? (
            <h1 className="flex items-center justify-center gap-3 text-4xl font-bold font-poppins text-text">
              Consignment {displayNumber}
              {ready && !isFulfilled && (
                <button
                  type="button"
                  onClick={() => {
                    setNumberDraft(formStatuses.number || "");
                    setNumberError("");
                  }}
                  className="rounded-lg p-2 text-base text-text/50 hover:bg-primary/10 hover:text-primary"
                  aria-label="Change the consignment number"
                  title="Change the consignment number"
                >
                  <FaPen />
                </button>
              )}
            </h1>
          ) : (
            <form onSubmit={saveNumber} className="mx-auto flex max-w-md flex-col items-center gap-2">
              <label htmlFor="consignment-number" className="text-sm font-medium text-text">
                Consignment number
              </label>
              <div className="flex w-full gap-2">
                <input
                  id="consignment-number"
                  value={numberDraft}
                  onChange={(e) => setNumberDraft(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="w-full rounded-lg border border-primary/30 bg-background px-3 py-2 text-lg text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button type="submit" disabled={savingNumber} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent disabled:opacity-60">
                  {savingNumber ? "Saving…" : "Save"}
                </button>
                <button type="button" onClick={() => setNumberDraft(null)} className="rounded-lg border border-text/15 px-4 py-2 text-sm text-text hover:bg-text/5">
                  Cancel
                </button>
              </div>
              {numberError && <p role="alert" className="text-sm text-red-600">{numberError}</p>}
            </form>
          )}
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

        {!ready && (
          <p
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border border-text/10 bg-surface px-4 py-3 text-sm text-text/70"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            Getting the latest details. Sections open in a moment.
          </p>
        )}

        {/* Forms Accordion */}
        <div className="space-y-4">
          {formsData.map((form, index) => {
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
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="bg-background rounded-2xl border border-primary/20 shadow-lg overflow-hidden"
              >
                {/* Accordion Header */}
                <div
                  aria-disabled={!ready}
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    ready ? "" : "cursor-wait opacity-60"
                  } ${
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
