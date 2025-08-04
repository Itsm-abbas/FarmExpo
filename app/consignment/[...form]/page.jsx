"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
import ConsignmentItemForm from "@components/Forms/Consignmentitem";
import ConsigneeForm from "@components/Forms/Consignee";
import ViewConsignee from "@components/ViewData/Consignee";
import ViewConsignmentItem from "@components/ViewData/ConsignmentItem";
import { FaArrowLeft } from "react-icons/fa";
import AllConsignments from "@components/ViewData/AllConsignments";
import FinancialInstrumentForm from "@components/Forms/FinancialInstrument";
import ViewFI from "@components/ViewData/Financialinstrument";
import { motion } from "framer-motion";
// Add other imports here...

export default function DynamicConsignmentPage() {
  const params = useParams();
  const [FormComponent, setFormComponent] = useState(null);
  const router = useRouter();
  // Component mapping
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
    // "consignmentitem/add-consignmentitem": ConsignmentItemForm,
    // "consignmentitem/view-consignmentitem": ViewConsignmentItem,
    "add-financialinstrument": FinancialInstrumentForm,
    "view-financial-instrument": ViewFI,

    "all-consignments": AllConsignments,

    // Add other mappings here...
  };

  useEffect(() => {
    if (params && params.form) {
      const dynamicPath = params.form.join("/"); // Convert segments to a path
      if (componentMap[dynamicPath]) {
        setFormComponent(() => componentMap[dynamicPath]);
      } else {
        setFormComponent(() => () => <p>404 - Component Not Found</p>);
      }
    }
  }, [params]);

  return (
    <div className="relative w-full h-full flex flex-col justify-center items-center py-20">
      <div className="absolute top-5 left-0 sm:left-10 md:left-28 lg:left-40">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-2 px-5 py-2 rounded-lg border border-LightBorder dark:border-DarkBorder bg-white dark:bg-DarkSBg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm sm:text-base font-medium shadow-md transition-all duration-300"
        >
          <FaArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform duration-300" />
          <span>Back</span>
        </motion.button>
      </div>
      {FormComponent && <FormComponent />}
    </div>
  );
}
