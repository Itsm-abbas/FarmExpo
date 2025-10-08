"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";

// Import your components
import CommodityForm from "@forms/Commodity";
import PackerForm from "@forms/Packer";
import PackagingForm from "@components/Forms/Packaging";
import TraderForm from "@forms/Trader";
import ViewCommodity from "@components/ViewData/Commodity";
import ViewTrader from "@components/ViewData/Trader";
import ViewPacker from "@components/ViewData/Packer";
import IataAgent from "@forms/IataAgent";
import ViewIataAgent from "@components/ViewData/IataAgent";
import CustomAgent from "@forms/CustomAgent";
import ViewCustomAgent from "@components/ViewData/CustomAgent";
import ViewPackaging from "@components/ViewData/Packaging";
import ConsigneeForm from "@components/Forms/Consignee";
import ViewConsignee from "@components/ViewData/Consignee";
import {
  FaArrowLeft,
  FaHome,
  FaBox,
  FaShippingFast,
  FaUsers,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import AllConsignments from "@components/ViewData/AllConsignments";
import FinancialInstrumentForm from "@components/Forms/FinancialInstrument";
import ViewFI from "@components/ViewData/Financialinstrument";
import { motion, AnimatePresence } from "framer-motion";

export default function DynamicConsignmentPage() {
  const params = useParams();
  const [FormComponent, setFormComponent] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const router = useRouter();

  // Simple component mapping without metadata to avoid icon issues
  const componentMap = {
    "consignee/add-consignee": ConsigneeForm,
    "consignee/view-consignee": ViewConsignee,
    "commodity/add-commodity": CommodityForm,
    "commodity/view-commodity": ViewCommodity,
    "packer/add-packer": PackerForm,
    "packer/view-packer": ViewPacker,
    "iata-agent/add-iataAgent": IataAgent,
    "iata-agent/view-iataAgent": ViewIataAgent,
    "custom-agent/add-customAgent": CustomAgent,
    "custom-agent/view-customAgent": ViewCustomAgent,
    "packaging/add-packaging": PackagingForm,
    "packaging/view-packaging": ViewPackaging,
    "trader/add-trader": TraderForm,
    "trader/view-trader": ViewTrader,
    "add-financialinstrument": FinancialInstrumentForm,
    "view-financial-instrument": ViewFI,
    "all-consignments": AllConsignments,
  };

  // Get page metadata based on path
  const getPageMetadata = (path) => {
    const metadataMap = {
      "consignee/add-consignee": {
        title: "Add Consignee",
        description: "Register a new consignee for your shipments",
        icon: "users",
      },
      "consignee/view-consignee": {
        title: "View Consignees",
        description: "Manage and view all consignees",
        icon: "users",
      },
      "commodity/add-commodity": {
        title: "Add Commodity",
        description: "Add a new commodity to your inventory",
        icon: "box",
      },
      "commodity/view-commodity": {
        title: "View Commodities",
        description: "Browse and manage your commodities",
        icon: "box",
      },
      "packer/add-packer": {
        title: "Add Packer",
        description: "Register a new packing service provider",
        icon: "users",
      },
      "packer/view-packer": {
        title: "View Packers",
        description: "Manage your packing service providers",
        icon: "users",
      },
      "iata-agent/add-iataAgent": {
        title: "Add IATA Agent",
        description: "Register a new IATA certified agent",
        icon: "shipping",
      },
      "iata-agent/view-iataAgent": {
        title: "View IATA Agents",
        description: "Manage your IATA certified agents",
        icon: "shipping",
      },
      "custom-agent/add-customAgent": {
        title: "Add Custom Agent",
        description: "Register a new custom clearance agent",
        icon: "users",
      },
      "custom-agent/view-customAgent": {
        title: "View Custom Agents",
        description: "Manage your custom clearance agents",
        icon: "users",
      },
      "packaging/add-packaging": {
        title: "Add Packaging",
        description: "Add a new packaging type with specifications",
        icon: "box",
      },
      "packaging/view-packaging": {
        title: "View Packaging",
        description: "Manage your packaging types and specifications",
        icon: "box",
      },
      "trader/add-trader": {
        title: "Add Trader",
        description: "Register a new trading partner",
        icon: "users",
      },
      "trader/view-trader": {
        title: "View Traders",
        description: "Manage your trading partners",
        icon: "users",
      },
      "add-financialinstrument": {
        title: "Add Financial Instrument",
        description: "Create a new financial instrument for transactions",
        icon: "file",
      },
      "view-financial-instrument": {
        title: "View Financial Instruments",
        description: "Manage your financial instruments and documents",
        icon: "file",
      },
      "all-consignments": {
        title: "All Consignments",
        description: "Overview of all your consignments and shipments",
        icon: "shipping",
      },
    };

    return (
      metadataMap[path] || {
        title: "Not Found",
        description: "The requested page was not found",
        icon: "box",
      }
    );
  };

  // Render icon based on string identifier
  const renderIcon = (iconType) => {
    const iconProps = { className: "text-3xl" };

    switch (iconType) {
      case "users":
        return <FaUsers {...iconProps} />;
      case "box":
        return <FaBox {...iconProps} />;
      case "shipping":
        return <FaShippingFast {...iconProps} />;
      case "file":
        return <FaFileInvoiceDollar {...iconProps} />;
      default:
        return <FaBox {...iconProps} />;
    }
  };

  useEffect(() => {
    if (params && params.form) {
      const dynamicPath = params.form.join("/");
      if (componentMap[dynamicPath]) {
        setFormComponent(() => componentMap[dynamicPath]);
        const metadata = getPageMetadata(dynamicPath);
        setPageTitle(metadata.title);
        setPageDescription(metadata.description);
      } else {
        // Create a proper NotFound component
        const NotFoundComponent = () => (
          <div className="text-center space-y-4 py-12">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <FaBox className="text-2xl text-red-500" />
            </div>
            <h2 className="text-2xl font-bold font-poppins text-text">
              404 - Page Not Found
            </h2>
            <p className="text-text/70 font-inter">
              The requested component could not be found.
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-poppins"
            >
              Go Home
            </button>
          </div>
        );

        setFormComponent(() => NotFoundComponent);
        setPageTitle("Not Found");
        setPageDescription("The requested page was not found");
      }
    }
  }, [params, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const metadata = getPageMetadata(params?.form?.join("/") || "");

  return (
    <div className="relative w-full min-h-screen bg-background">
      {/* Header Section */}
      <motion.div
        className="relative bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => router.back()}
              whileHover={{ scale: 1.03, x: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-background/80 backdrop-blur-sm text-text font-poppins font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/5"
            >
              <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Back</span>
            </motion.button>

            <motion.button
              onClick={() => router.push("/")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-poppins font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-primary/90"
            >
              <FaHome className="text-sm" />
              <span>Home</span>
            </motion.button>
          </div>

          {/* Page Header */}
          <motion.div
            className="text-center space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="flex justify-center" variants={itemVariants}>
              <div className="p-4 rounded-2xl bg-primary/10 text-primary">
                {renderIcon(metadata.icon)}
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl font-bold font-poppins text-text"
              variants={itemVariants}
            >
              {pageTitle}
            </motion.h1>

            <motion.p
              className="text-lg text-text/70 font-inter max-w-2xl mx-auto"
              variants={itemVariants}
            >
              {pageDescription}
            </motion.p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={params.form?.join("/")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex justify-center w-full"
          >
            {FormComponent && <FormComponent />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
      </div>
    </div>
  );
}
