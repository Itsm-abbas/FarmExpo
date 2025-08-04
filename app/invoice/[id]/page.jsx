"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import moment from "moment";
import fonts from "@utils/fonts";
// import * as XLSX from "xlsx";
import axiosInstance from "@utils/axiosConfig";
import XLSX from "xlsx-js-style";

const Invoice = () => {
  const params = useParams();
  const consignmentId = params?.id;
  const [consignment, setConsignment] = useState(null);
  const [fiuData, setFiuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [netWeight, setNetWeight] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [totalAirwayBill, setTotalAirwayBill] = useState("");
  const [totalPackingAmount, setTotalPackingAmount] = useState("");
  const [totalGoodsAmount, setTotalGoodAmount] = useState("");
  const [totalRecovery, setTotalRecovery] = useState("");
  const [totalPackagingCost, setTotalPackagingCost] = useState("");
  const [customFee, setCustomFee] = useState("");
  const [dailyExpenses, setDailyExpenses] = useState("");
  const [CFR, setCFR] = useState("");

  useEffect(() => {
    let totalNetWeight = 0;
    let totalTareWeight = 0;

    consignment?.goods?.forEach((good) => {
      const ctntWeight =
        (good.quantity || 0) * (good.packaging?.packagingWeightPerUnit || 0);
      const totalWeight = (good.weightPerUnit || 0) * (good.quantity || 0);

      totalNetWeight += totalWeight;
      totalTareWeight += ctntWeight;
    });

    setNetWeight(totalNetWeight);
    setTareWeight(totalTareWeight);
    setGrossWeight(totalNetWeight + totalTareWeight);
    //CFR
    const totalcfr =
      consignment?.goodsDeclaration?.fob +
      consignment?.goodsDeclaration?.gdFreight;
    setCFR(totalcfr);
    // Total AirwayBill
    const totalA =
      consignment?.airwayBill?.rate *
        consignment?.airwayBill?.airwayBillWeight +
      consignment?.airwayBill?.fee;
    setTotalAirwayBill(totalA);
    // Total Packing Rate
    const totalPackging =
      consignment?.airwayBill?.airwayBillWeight *
      consignment?.packing?.ratePerKg;
    setTotalPackingAmount(totalPackging);

    // Goods
    const totalG = consignment?.goods.reduce((acc, good) => {
      const totalWeight = (good.weightPerUnit || 0) * (good.quantity || 0);
      const totalAmount = totalWeight * (good.commodityPerUnitCost || 0);
      return acc + totalAmount;
    }, 0);

    setTotalGoodAmount(parseInt(totalG));
    // Daily Expenses
    setDailyExpenses(consignment?.dailyExpenses);
    // Total Recovery
    const totalRecovery =
      consignment?.recoveryDone?.amount *
      consignment?.recoveryDone?.exchangeRate;
    setTotalRecovery(totalRecovery);
    // Total Packaging Cost
    const totalPackaging = consignment?.goods.reduce((acc, good) => {
      const totalAmount = good.quantity * good.packagingPerUnitCost;
      return acc + totalAmount;
    }, 0);
    setTotalPackagingCost(totalPackaging);
    // Custom Fee
    setCustomFee(consignment?.customClearance?.fee);
  }, [consignment]); // Runs only when `consignment` changes

  // Fetch consignment and FIU data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consignmentRes, fiuRes] = await Promise.all([
          axiosInstance.get(`/consignment/${consignmentId}`),
          axiosInstance.get("/utilization"),
        ]);

        setConsignment(consignmentRes.data);
        // Filter FIU data for this consignment's goods declaration
        if (consignmentRes.data?.goodsDeclarationId) {
          const filteredFiu = fiuRes.data.filter(
            (fiu) =>
              fiu.goodsDeclarationId === consignmentRes.data.goodsDeclarationId
          );
          setFiuData(filteredFiu);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [consignmentId]);

  // Calculate totals
  const calculateTotals = () => {
    if (!consignment?.goods) return { totalWeight: 0, totalAmount: 0 };

    return consignment.goods.reduce(
      (acc, good) => {
        const weight = (good.weightPerUnit || 0) * (good.quantity || 0);
        const amount = weight * (good.commodityPerUnitCost || 0);
        return {
          totalWeight: acc.totalWeight + weight,
          totalAmount: acc.totalAmount + amount,
        };
      },
      { totalWeight: 0, totalAmount: 0 }
    );
  };

  const { totalWeight, totalAmount } = calculateTotals();

  const calculateFiuUtilize = () => {
    if (!fiuData || !Array.isArray(fiuData)) return 0;
    return fiuData.reduce((total, fiu) => total + (fiu.utilized || 0), 0);
  };

  const totalutilize = calculateFiuUtilize();

  let grandTotal =
    totalRecovery -
    (totalAirwayBill +
      totalPackagingCost +
      totalGoodsAmount +
      totalPackingAmount +
      dailyExpenses +
      customFee);
  // To excel
  const exportToExcel = () => {
    if (!consignment) return;

    // Style definitions with your color scheme
    const primaryColor = "10B981"; // Emerald
    const secondaryColor = "3B82F6"; // Blue

    const titleStyle = {
      font: { bold: true, size: 16, color: { rgb: primaryColor } },
      alignment: { horizontal: "center" },
    };

    const sectionHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: primaryColor } },
      alignment: { horizontal: "center" },
    };

    const tableHeaderStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: secondaryColor } },
      alignment: { horizontal: "center" },
    };

    const tableCellStyle = {
      border: {
        top: { style: "thin", color: { rgb: "D3D3D3" } },
        bottom: { style: "thin", color: { rgb: "D3D3D3" } },
        left: { style: "thin", color: { rgb: "D3D3D3" } },
        right: { style: "thin", color: { rgb: "D3D3D3" } },
      },
    };

    const totalRowStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: "F2F2F2" } },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      },
    };

    // Create worksheet data
    const invoiceData = [
      // Title row (merged)
      [{ v: "FarmExpo - Invoice", t: "s", s: titleStyle }],

      // Header info
      [
        { v: "Consignment ID", t: "s", s: { font: { bold: true } } },
        { v: consignment?.id, t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Date", t: "s", s: { font: { bold: true } } },
        { v: new Date(consignment?.date).toLocaleDateString(), t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [""], // Spacer

      // Trader & Consignee section - FIXED HEADERS
      [
        { v: "Trader Details", t: "s", s: sectionHeaderStyle },
        "",
        "",
        { v: "Consignee Details", t: "s", s: sectionHeaderStyle },
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Name:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.trader?.name, t: "s" },
        "",
        "",
        { v: "Name:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.consignee?.vendor.name, t: "s" },
        "",
        "",
      ],
      [
        { v: "Address:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.trader?.address, t: "s" },
        "",
        "",
        { v: "Address:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.consignee?.vendor.address, t: "s" },
        "",
        "",
      ],
      [
        { v: "Country:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.trader?.country, t: "s" },
        "",
        "",
        { v: "Country:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.consignee?.vendor.country, t: "s" },
        "",
        "",
      ],
      [
        { v: "NTN:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.trader?.ntn, t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [""], // Spacer

      // Airway Bill & Goods Declaration (matches website headers)
      [
        { v: "Airway Bill", t: "s", s: sectionHeaderStyle },
        "",
        "",
        { v: "Goods Declaration", t: "s", s: sectionHeaderStyle },
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Number:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.airwayBill?.number, t: "s" },
        "",
        "",
        { v: "Number:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.goodsDeclaration?.number, t: "s" },
        "",
        "",
      ],
      [
        { v: "Agent:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.airwayBill?.iataAgent?.vendor.name, t: "s" }, // FIXED: Added fallback
        "",
        "",
        { v: "Date:", t: "s", s: { font: { bold: true } } },
        {
          v: consignment?.goodsDeclaration?.date.slice(0, 10),
          t: "s",
        }, // FIXED: Added date formatting
        "",
        "",
      ],
      [
        { v: "Station:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.airwayBill?.iataAgent?.vendor.station, t: "s" },
        "",
        "",
        { v: "Exchange Rate:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.goodsDeclaration?.exchangeRate, t: "s" },
        "",
        "",
      ],
      [
        { v: "Date:", t: "s", s: { font: { bold: true } } },
        {
          v: new Date(consignment?.airwayBill?.dateTime)?.toLocaleString(),
          t: "s",
        },
        "",
        "",
        { v: "Invoice No:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.goodsDeclaration?.commercialInvoiceNumber, t: "s" },
        "",
        "",
      ],
      [
        { v: "Rate:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.airwayBill?.rate, t: "s" },
        "",
        "",
        { v: "FOB:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.goodsDeclaration?.fob, t: "s" },
        "",
        "",
      ],
      [
        { v: "Weight:", t: "s", s: { font: { bold: true } } },
        { v: `${consignment?.airwayBill?.airwayBillWeight} kg`, t: "s" },
        "",
        "",
        { v: "GD Freight:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.goodsDeclaration?.gdFreight, t: "s" },
        "",
        "",
      ],
      [
        { v: "Fee:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.airwayBill?.fee, t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [""], // Spacer

      // Financial Instrument Utilization section
      ...(fiuData.length > 0
        ? [
            [
              {
                v: "Financial Instrument Utilization",
                t: "s",
                s: sectionHeaderStyle,
              },
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              { v: "Instrument", t: "s", s: tableHeaderStyle },
              { v: "Utilized", t: "s", s: tableHeaderStyle },
              { v: "Balance", t: "s", s: tableHeaderStyle },
              "",
              "",
              "",
              "",
              "",
            ],
            ...fiuData.map((fiu) => [
              { v: fiu.financialInstrument?.number, t: "s", s: tableCellStyle },
              {
                v: fiu.utilized + " " + fiu.financialInstrument?.currency,
                t: "n",
                s: tableCellStyle,
              },
              {
                v:
                  fiu.financialInstrument?.balance +
                  " " +
                  fiu.financialInstrument?.currency,
                t: "n",
                s: tableCellStyle,
              },
              "",
              "",
              "",
              "",
              "",
            ]),
            [""], // Spacer
          ]
        : []),
      // Goods Table (matches website headers exactly)
      [
        { v: "Goods", t: "s", s: sectionHeaderStyle },
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Item", t: "s", s: tableHeaderStyle },
        { v: "Qty", t: "s", s: tableHeaderStyle },
        { v: "Per Unit", t: "s", s: tableHeaderStyle },
        { v: "ctn Weight", t: "s", s: tableHeaderStyle },
        { v: "ctn tWeight", t: "s", s: tableHeaderStyle },
        { v: "Rate per Unit", t: "s", s: tableHeaderStyle },
        { v: "tWeight", t: "s", s: tableHeaderStyle },
        { v: "Total Amount", t: "s", s: tableHeaderStyle },
      ],
      ...consignment?.goods?.map((good) => {
        const ctntWeight =
          (good.quantity || 0) * (good.packaging?.packagingWeightPerUnit || 0);
        const totalWeight = (good.weightPerUnit || 0) * (good.quantity || 0);
        const totalAmount = totalWeight * (good.commodityPerUnitCost || 0);

        return [
          { v: good?.commodityItem?.name, t: "s", s: tableCellStyle },
          { v: good?.quantity, t: "n", s: tableCellStyle },
          {
            v: `${good?.weightPerUnit?.toFixed(1)} kg`,
            t: "s",
            s: tableCellStyle,
          },
          {
            v: `${good?.packaging?.packagingWeightPerUnit || 0} kg`,
            t: "s",
            s: tableCellStyle,
          },
          { v: `${ctntWeight} kg`, t: "s", s: tableCellStyle },
          { v: good?.commodityPerUnitCost, t: "n", s: tableCellStyle },
          { v: `${totalWeight} kg`, t: "s", s: tableCellStyle },
          { v: totalAmount.toFixed(2), t: "n", s: tableCellStyle },
        ];
      }),
      [
        { v: "TOTAL", t: "s", s: totalRowStyle },
        { v: "", t: "s", s: totalRowStyle },
        { v: "", t: "s", s: totalRowStyle },
        { v: "", t: "s", s: totalRowStyle },
        { v: "", t: "s", s: totalRowStyle },
        { v: "", t: "s", s: totalRowStyle },
        { v: `${totalWeight.toFixed(2)} kg`, t: "s", s: totalRowStyle },
        { v: totalAmount.toFixed(2), t: "n", s: totalRowStyle },
      ],
      [""], // Spacer

      // Totals & Recovery (matches website)
      [
        { v: "Totals", t: "s", s: sectionHeaderStyle },
        "",
        "",
        { v: "Recovery", t: "s", s: sectionHeaderStyle },
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Net Weight:", t: "s", s: { font: { bold: true } } },
        { v: `${netWeight} kg`, t: "s" },
        "",
        "",
        { v: "Amount:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.recoveryDone?.amount, t: "s" },
        "",
        "",
      ],
      [
        { v: "Tare Weight:", t: "s", s: { font: { bold: true } } },
        { v: `${tareWeight} kg`, t: "s" },
        "",
        "",
        { v: "Currency:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.recoveryDone?.currency, t: "s" },
        "",
        "",
      ],
      [
        { v: "Gross Weight:", t: "s", s: { font: { bold: true } } },
        { v: `${grossWeight} kg`, t: "s" },
        "",
        "",
        { v: "Exchange Rate:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.recoveryDone?.exchangeRate, t: "s" },
        "",
        "",
      ],
      [
        { v: "Daily Expenses:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.dailyExpenses, t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [
        { v: "Status:", t: "s", s: { font: { bold: true } } },
        { v: consignment?.status, t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [""], // Spacer
      [
        {
          v: grandTotal > 0 ? "Profit" : "Loss",
          t: "s",
          s: { font: { bold: true } },
        },
        { v: Math.abs(grandTotal).toLocaleString(), t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
      [""], // Spacer

      // Footer (matches website)
      [
        { v: "Generated on:", t: "s", s: { font: { italic: true } } },
        { v: moment().format("MMMM Do YYYY, h:mm:ss a"), t: "s" },
        "",
        "",
        "",
        "",
        "",
        "",
      ],
    ];

    // Filter out empty rows from conditional sections
    const filteredInvoiceData = invoiceData.filter((row) => row.length > 0);

    // Create worksheet
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(invoiceData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Merge cells (only for title and section headers)
    worksheet["!merges"] = [
      // Title
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      // Section headers
      // { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Trader
      // { s: { r: 4, c: 4 }, e: { r: 4, c: 7 } }, // Consignee
      { s: { r: 12, c: 0 }, e: { r: 12, c: 3 } }, // Airway
      { s: { r: 12, c: 4 }, e: { r: 12, c: 7 } }, // Goods Decl
      {
        s: { r: 20 + (fiuData.length > 0 ? 2 + fiuData.length : 0), c: 0 },
        e: { r: 20 + (fiuData.length > 0 ? 2 + fiuData.length : 0), c: 7 },
      }, // Goods
      {
        s: {
          r:
            23 +
            (fiuData.length > 0 ? 2 + fiuData.length : 0) +
            consignment?.goods?.length,
          c: 0,
        },
        e: {
          r:
            23 +
            (fiuData.length > 0 ? 2 + fiuData.length : 0) +
            consignment?.goods?.length,
          c: 3,
        },
      }, // Totals
      {
        s: {
          r:
            23 +
            (fiuData.length > 0 ? 2 + fiuData.length : 0) +
            consignment?.goods?.length,
          c: 4,
        },
        e: {
          r:
            23 +
            (fiuData.length > 0 ? 2 + fiuData.length : 0) +
            consignment?.goods?.length,
          c: 7,
        },
      }, // Recovery
    ];

    // Create workbook and save
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    XLSX.writeFile(workbook, `FarmExpo_Invoice_${consignment?.id}.xlsx`, {
      compression: true,
      bookType: "xlsx",
    });
  };

  const generatePDF = async () => {
    let loadingIndicator = null;

    try {
      const element = document.getElementById("invoice");
      if (!element) {
        console.error("Invoice element not found");
        return;
      }

      // Create a cool loading indicator with animation
      loadingIndicator = document.createElement("div");
      loadingIndicator.style.position = "fixed";
      loadingIndicator.style.top = "0";
      loadingIndicator.style.left = "0";
      loadingIndicator.style.width = "100%";
      loadingIndicator.style.height = "100%";
      loadingIndicator.style.backgroundColor = "rgba(0,0,0,0.7)";
      loadingIndicator.style.display = "flex";
      loadingIndicator.style.flexDirection = "column";
      loadingIndicator.style.justifyContent = "center";
      loadingIndicator.style.alignItems = "center";
      loadingIndicator.style.zIndex = "9999";
      loadingIndicator.innerHTML = `
        <div style="
          width: 80px;
          height: 80px;
          border: 8px solid #f3f3f3;
          border-top: 8px solid ${
            consignment?.status === "Fulfilled" ? "#10B981" : "#3B82F6"
          };
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <div style="color: white; font-size: 1.5rem; font-family: Arial;">
          Generating Invoice...
          <div style="font-size: 0.8rem; margin-top: 10px;">Please wait while we prepare your document</div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingIndicator);

      // Wait briefly to ensure loading indicator is visible
      await new Promise((resolve) => setTimeout(resolve, 50));

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm margin on each side
      const imgWidth = pageWidth - margin * 2;

      // First capture the entire element to calculate total height
      const fullCanvas = await html2canvas(element, {
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowHeight: element.scrollHeight,
      });

      const totalHeight = fullCanvas.height;
      const viewportHeight = Math.floor(
        (pageHeight - margin * 2) * (fullCanvas.width / imgWidth)
      );
      const totalPages = Math.ceil(totalHeight / viewportHeight);

      // Render each page
      for (let i = 0; i < totalPages; i++) {
        const canvas = await html2canvas(element, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowHeight: viewportHeight,
          scrollY: i * viewportHeight,
          scrollX: 0,
          x: 0,
          y: i * viewportHeight,
          width: element.offsetWidth,
          height: viewportHeight,
        });

        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          margin,
          margin,
          imgWidth,
          imgHeight
        );
      }

      pdf.save(
        `FarmExpo_Invoice_${consignmentId}_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      if (loadingIndicator && document.body.contains(loadingIndicator)) {
        loadingIndicator.style.transition = "opacity 0.3s ease";
        loadingIndicator.style.opacity = "0";
        setTimeout(() => {
          document.body.removeChild(loadingIndicator);
        }, 300);
      }
    }
  };

  // Trigger print dialog
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        ></motion.div>
      </div>
    );
  }

  if (!consignment) {
    return (
      <div
        className={` text-center text-red-500 mt-10 bg-gray-100 dark:bg-gray-900 dark:text-red-400`}
      >
        Failed to load invoice data.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 bg-gray-100 dark:bg-gray-900 min-h-screen ${fonts.openSans.className}`}
    >
      <div
        id="invoice"
        className="print-area bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 max-w-4xl mx-auto text-sm"
      >
        {/* Header */}
        <div className="text-center mb-6 border-b pb-4 border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            FarmExpo - Invoice
          </h1>
          <div className="flex justify-center gap-4 text-gray-600 dark:text-gray-300">
            <p>
              <span className="font-semibold">Consignment ID:</span>
              {consignment?.id}
            </p>
            <p>
              <span className="font-semibold">Date:</span>
              {new Date(consignment?.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {/* Trader & Consignee Table */}
        <table className="table w-full mb-6 border border-gray-200 dark:border-gray-700 ">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3 text-left border-b w-1/2 border-gray-200 dark:border-gray-700">
                Trader Details
              </th>
              <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                Consignee Details
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 ">
                <p className="mb-1">
                  <span className="font-semibold">Name:</span>
                  {consignment?.trader?.name}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Address:</span>
                  {consignment?.trader?.address}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Country:</span>
                  {consignment?.trader?.country}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">NTN:</span>
                  {consignment?.trader?.ntn}
                </p>
              </td>
              <td className="p-3">
                <p className="mb-1">
                  <span className="font-semibold">Name:</span>
                  {consignment?.consignee?.vendor.name}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Address:</span>
                  {consignment?.consignee?.vendor.address}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Country:</span>
                  {consignment?.consignee?.vendor.country}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Airway Bill & Goods Declaration Table */}
        <table className="table w-full mb-6 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3  w-1/2 text-left border-b border-gray-200 dark:border-gray-700">
                Airway/Seaway Bill
              </th>
              <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                Goods Declaration
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 ">
                <p className="mb-1">
                  <span className="font-semibold">Number:</span>
                  {consignment?.airwayBill?.number}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Agent:</span>
                  {consignment?.airwayBill?.iataAgent?.vendor.name}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Station:</span>
                  {consignment?.airwayBill?.iataAgent?.vendor.station}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Date:</span>
                  {new Date(
                    consignment?.airwayBill?.dateTime
                  )?.toLocaleString()}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Rate:</span>
                  {consignment?.airwayBill?.rate?.toLocaleString()}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Weight:</span>
                  {consignment?.airwayBill?.airwayBillWeight?.toLocaleString()}{" "}
                  kg
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Fee:</span>
                  {consignment?.airwayBill?.fee?.toLocaleString()}
                </p>
                <p className="mt-3  p-1 bg-gray-200 dark:bg-gray-600 font-semibold flex justify-between">
                  <span>Total</span>
                  {totalAirwayBill?.toLocaleString()}
                </p>
              </td>
              <td className="p-3 flex flex-col">
                <p className="mb-1">
                  <span className="font-semibold">Number:</span>
                  {consignment?.goodsDeclaration?.number}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Date:</span>
                  {new Date(
                    consignment?.goodsDeclaration?.date
                  ).toLocaleDateString()}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Exchange Rate:</span>
                  {consignment?.goodsDeclaration?.exchangeRate}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Invoice No:</span>
                  {consignment?.goodsDeclaration?.commercialInvoiceNumber}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">FOB:</span>
                  {consignment?.goodsDeclaration?.fob}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">GD Freight:</span>
                  {consignment?.goodsDeclaration?.gdFreight}
                </p>{" "}
                <p className="mt-3 flex justify-between p-1 bg-gray-200 dark:bg-gray-600 dark:text-white font-semibold">
                  <span>CFR</span>
                  {CFR.toLocaleString()}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        {/* Custom Clearance & Packing Table */}
        <table className="table w-full mb-6 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-3 w-1/2 text-left border-b border-gray-200 dark:border-gray-700">
                Custom Clearance
              </th>
              <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                Packing
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700">
                <p className="mb-1">
                  <span className="font-semibold">Custom Agent Name:</span>
                  {consignment?.customClearance?.customAgent?.vendor.name}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Custom Agent Station:</span>
                  {consignment?.customClearance?.customAgent?.vendor.station}
                </p>
                <p className="mt-3  p-1 bg-gray-200 dark:bg-gray-600 font-semibold flex justify-between">
                  <span>Fee</span>
                  {consignment?.customClearance?.fee?.toLocaleString()}
                </p>
              </td>
              <td className="p-3">
                <p className="mb-1">
                  <span className="font-semibold">Packer:</span>
                  {consignment?.packing?.packer?.vendor.name}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Station:</span>
                  {consignment?.packing?.packer?.vendor.station}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Rate per Kg:</span>
                  {consignment?.packing?.ratePerKg}
                </p>
                <p className="mt-3  p-1 bg-gray-200 dark:bg-gray-600 dark:text-white font-semibold flex justify-between">
                  <span>Total</span>
                  {totalPackingAmount}
                </p>
              </td>
            </tr>
          </tbody>
          {/* Financial Instrument */}
        </table>
        {fiuData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
              Financial Instrument Utilization
            </h2>
            <table className="table w-full border border-gray-200 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                    Instrument
                  </th>
                  <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                    Amount
                  </th>
                  <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                    Utilized
                  </th>
                  <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                    Balance
                  </th>
                  <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                    Expiry
                  </th>
                </tr>
              </thead>
              <tbody>
                {fiuData.map((fiu, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-3">{fiu.financialInstrument?.number}</td>
                    <td className="p-3">
                      {fiu.financialInstrument?.amount?.toLocaleString()}{" "}
                      {fiu.financialInstrument?.currency}
                    </td>
                    <td className="p-3">
                      {fiu.utilized?.toLocaleString()}{" "}
                      {fiu.financialInstrument?.currency}
                    </td>
                    <td className="p-3">
                      {fiu.financialInstrument?.balance?.toLocaleString()}{" "}
                      {fiu.financialInstrument?.currency}
                    </td>
                    <td className="p-3">
                      {fiu.financialInstrument?.expiryDate.slice(0, 10)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-100 dark:bg-gray-600 dark:text-white font-semibold">
                  <td className="p-2">TOTAL</td>
                  <td className="p-2"></td>
                  <td className="p-2">{totalutilize.toLocaleString()}</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {/* Packaging Table with Total Row */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
            Goods
          </h2>
          <table className="table w-full border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Item
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Qty
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Per Unit
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  ctn Weight
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  ctn tWeight
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Rate per Unit
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  tWeight
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {consignment?.goods?.map((good, index) => {
                const ctntWeight =
                  (good.quantity || 0) *
                  (good.packaging?.packagingWeightPerUnit || 0);

                const totalWeight =
                  (good.weightPerUnit || 0) * (good.quantity || 0);
                const totalAmount =
                  totalWeight * (good.commodityPerUnitCost || 0);

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-2">{good?.commodityItem?.name}</td>
                    <td className="p-2">{good?.quantity?.toLocaleString()}</td>
                    <td className="p-2">
                      {good?.weightPerUnit?.toFixed(1)?.toLocaleString()} kg
                    </td>
                    <td className="p-2">
                      {good?.packaging?.packagingWeightPerUnit?.toLocaleString() ||
                        0}
                      kg
                    </td>
                    <td className="p-2">{ctntWeight?.toLocaleString()} kg</td>
                    <td className="p-2">
                      {good?.commodityPerUnitCost?.toLocaleString()}
                    </td>
                    <td className="p-2">{totalWeight?.toLocaleString()} kg</td>
                    <td className="p-2 font-semibold ">
                      {totalAmount?.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-gray-100 dark:bg-gray-600 dark:text-white font-semibold">
                <td className="p-2">TOTAL</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2">{totalWeight?.toLocaleString()} kg</td>
                <td className="p-2">{totalGoodsAmount?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>{" "}
        {/* Goods Table with Total Row */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
            Packaging
          </h2>
          <table className="table w-full border border-gray-200 dark:border-gray-700">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Packing Material
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Quantity
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Price
                </th>
                <th className="p-2 text-left border-b border-gray-200 dark:border-gray-700">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {consignment?.goods?.map((good, index) => {
                return (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="p-2">{good?.packaging?.name}</td>
                    <td className="p-2">{good?.quantity?.toLocaleString()}</td>
                    <td className="p-2">
                      {good?.packagingPerUnitCost?.toLocaleString()}
                    </td>
                    <td className="p-2">
                      {(
                        good?.packagingPerUnitCost * good?.quantity
                      )?.toLocaleString() || 0}
                    </td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold">
                <td className="p-2">TOTAL</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2">{totalPackagingCost?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Totals & Recovery */}
        <table className="table w-full mb-6 border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 ">
              <th className="p-3 text-left border-b w-1/2 border-gray-200 dark:border-gray-700">
                Totals
              </th>
              <th className="p-3 text-left border-b border-gray-200 dark:border-gray-700">
                Recovery
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 ">
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Net Weight</span>
                  {netWeight?.toLocaleString()} kg
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Tare Weight</span>
                  {tareWeight?.toLocaleString()} kg
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Gross Weight</span>
                  {grossWeight?.toLocaleString()} kg
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Daily Expenses</span>
                  {consignment?.dailyExpenses?.toLocaleString()}
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Status</span>
                  <span
                    className={`${
                      consignment?.status == "Fulfilled"
                        ? "text-green-500 p-1 "
                        : "text-red-500 p-1 "
                    }`}
                  >
                    {consignment?.status}
                  </span>
                </p>
                <p className="mt-3  p-1 bg-gray-200 dark:bg-gray-600 dark:text-white font-semibold flex justify-between">
                  <span>Total Cost</span>
                  {(
                    totalAirwayBill +
                    totalPackagingCost +
                    totalGoodsAmount +
                    totalPackingAmount +
                    dailyExpenses +
                    customFee
                  ).toLocaleString()}
                </p>
              </td>
              <td className="p-3 flex flex-col">
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Amount:</span>
                  {consignment?.recoveryDone?.amount}
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Currency:</span>
                  {consignment?.recoveryDone?.currency}
                </p>
                <p className="mb-1 border-b-2 flex justify-between">
                  <span className="font-semibold">Exchange Rate:</span>
                  {consignment?.recoveryDone?.exchangeRate}
                </p>
                <p className="mt-3 p-1 flex justify-between  bg-gray-200 dark:bg-gray-600 dark:text-white font-bold">
                  <span>Total Recovery :</span>{" "}
                  {totalRecovery?.toLocaleString()}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
        <h1 className="w-full font-bold flex gap-4 justify-center items-center p-2 bg-gray-200 dark:bg-gray-600 dark:text-white">
          <span>{grandTotal > 0 ? "Profit" : "Loss"} =</span>
          <span>{Math.abs(grandTotal).toLocaleString()}</span>
        </h1>
        {/* <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          Invoice generated on: {moment().format("MMMM Do YYYY, h:mm:ss a")}
        </div> */}
      </div>

      {/* Buttons */}
      <div className="fixed bottom-6 right-6 flex gap-4 print:hidden">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportToExcel}
          className="bg-[#217346] text-white px-4 py-2 rounded-lg shadow hover:bg-[#1A5A36] transition"
        >
          Export to Excel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generatePDF}
          className="bg-SecondaryButton text-white px-4 py-2 rounded-lg shadow hover:bg-SecondaryButtonHover transition dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Download PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="bg-[#4A4A4A] text-white px-4 py-2 rounded-lg shadow hover:bg-[#333333] transition"
        >
          Take Print
        </motion.button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 12px;
          }
          .print-area {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Invoice;
