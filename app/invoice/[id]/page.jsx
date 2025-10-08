"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import moment from "moment";
import XLSX from "xlsx-js-style";
import axiosInstance from "@utils/axiosConfig";
import {
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaDownload,
  FaCalculator,
  FaWeight,
  FaMoneyBillWave,
  FaBox,
  FaShippingFast,
  FaFileInvoice,
} from "react-icons/fa";

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
  }, [consignment]);

  // Fetch consignment and FIU data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consignmentRes, fiuRes] = await Promise.all([
          axiosInstance.get(`/consignment/${consignmentId}`),
          axiosInstance.get("/utilization"),
        ]);

        setConsignment(consignmentRes.data);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
        ></motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 dark:text-gray-300 text-lg"
        >
          Loading Invoice Data...
        </motion.p>
      </div>
    );
  }

  if (!consignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileInvoice className="text-2xl text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            Invoice Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Failed to load invoice data for this consignment.
          </p>
        </motion.div>
      </div>
    );
  }

  const totalCost =
    totalAirwayBill +
    totalPackagingCost +
    totalGoodsAmount +
    totalPackingAmount +
    dailyExpenses +
    customFee;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4"
    >
      {/* Header Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <FaFileInvoice className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">
                  FarmExpo Invoice
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Consignment #{consignmentId}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Status
                </p>
                <p
                  className={`font-semibold ${
                    consignment?.status === "Fulfilled"
                      ? "text-green-600 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {consignment?.status}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Recovery
                </p>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  {totalRecovery?.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Profit/Loss
                </p>
                <p
                  className={`font-semibold ${
                    grandTotal > 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {Math.abs(grandTotal)?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-3">
          <motion.div
            id="invoice"
            className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 lg:p-8 space-y-6"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-blue-200 dark:border-gray-600 pb-6">
              <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                FarmExpo - Commercial Invoice
              </h1>
              <div className="flex flex-wrap justify-center gap-6 text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Consignment ID:</span>
                  <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    #{consignment?.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Date:</span>
                  <span>
                    {new Date(consignment?.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trader & Consignee */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaShippingFast className="text-blue-500" />
                  Trader Details
                </h3>
                <div className="space-y-2">
                  <InfoRow label="Name" value={consignment?.trader?.name} />
                  <InfoRow
                    label="Address"
                    value={consignment?.trader?.address}
                  />
                  <InfoRow
                    label="Country"
                    value={consignment?.trader?.country}
                  />
                  <InfoRow label="NTN" value={consignment?.trader?.ntn} />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaShippingFast className="text-green-500" />
                  Consignee Details
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Name"
                    value={consignment?.consignee?.vendor.name}
                  />
                  <InfoRow
                    label="Address"
                    value={consignment?.consignee?.vendor.address}
                  />
                  <InfoRow
                    label="Country"
                    value={consignment?.consignee?.vendor.country}
                  />
                </div>
              </div>
            </div>

            {/* Airway Bill & Goods Declaration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaShippingFast className="text-blue-600" />
                  Airway/Seaway Bill
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Number"
                    value={consignment?.airwayBill?.number}
                  />
                  <InfoRow
                    label="Agent"
                    value={consignment?.airwayBill?.iataAgent?.vendor.name}
                  />
                  <InfoRow
                    label="Station"
                    value={consignment?.airwayBill?.iataAgent?.vendor.station}
                  />
                  <InfoRow
                    label="Date"
                    value={new Date(
                      consignment?.airwayBill?.dateTime
                    )?.toLocaleString()}
                  />
                  <InfoRow
                    label="Rate"
                    value={consignment?.airwayBill?.rate?.toLocaleString()}
                  />
                  <InfoRow
                    label="Weight"
                    value={`${consignment?.airwayBill?.airwayBillWeight?.toLocaleString()} kg`}
                  />
                  <InfoRow
                    label="Fee"
                    value={consignment?.airwayBill?.fee?.toLocaleString()}
                  />
                  <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                    <InfoRow
                      label="Total"
                      value={totalAirwayBill?.toLocaleString()}
                      highlight
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaFileInvoice className="text-green-600" />
                  Goods Declaration
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Number"
                    value={consignment?.goodsDeclaration?.number}
                  />
                  <InfoRow
                    label="Date"
                    value={new Date(
                      consignment?.goodsDeclaration?.date
                    ).toLocaleDateString()}
                  />
                  <InfoRow
                    label="Exchange Rate"
                    value={consignment?.goodsDeclaration?.exchangeRate}
                  />
                  <InfoRow
                    label="Invoice No"
                    value={
                      consignment?.goodsDeclaration?.commercialInvoiceNumber
                    }
                  />
                  <InfoRow
                    label="FOB"
                    value={consignment?.goodsDeclaration?.fob}
                  />
                  <InfoRow
                    label="GD Freight"
                    value={consignment?.goodsDeclaration?.gdFreight}
                  />
                  <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-2">
                    <InfoRow
                      label="CFR"
                      value={CFR?.toLocaleString()}
                      highlight
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Clearance & Packing */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaFileInvoice className="text-purple-600" />
                  Custom Clearance
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Agent Name"
                    value={
                      consignment?.customClearance?.customAgent?.vendor.name
                    }
                  />
                  <InfoRow
                    label="Station"
                    value={
                      consignment?.customClearance?.customAgent?.vendor.station
                    }
                  />
                  <div className="border-t border-purple-200 dark:border-purple-700 pt-2 mt-2">
                    <InfoRow
                      label="Fee"
                      value={consignment?.customClearance?.fee?.toLocaleString()}
                      highlight
                    />
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaBox className="text-orange-600" />
                  Packing
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Packer"
                    value={consignment?.packing?.packer?.vendor.name}
                  />
                  <InfoRow
                    label="Station"
                    value={consignment?.packing?.packer?.vendor.station}
                  />
                  <InfoRow
                    label="Rate per Kg"
                    value={consignment?.packing?.ratePerKg}
                  />
                  <div className="border-t border-orange-200 dark:border-orange-700 pt-2 mt-2">
                    <InfoRow
                      label="Total"
                      value={totalPackingAmount?.toLocaleString()}
                      highlight
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Instruments */}
            {fiuData.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-indigo-600" />
                  Financial Instrument Utilization
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-indigo-200 dark:border-indigo-700">
                        <th className="text-left p-2 font-semibold">
                          Instrument
                        </th>
                        <th className="text-left p-2 font-semibold">Amount</th>
                        <th className="text-left p-2 font-semibold">
                          Utilized
                        </th>
                        <th className="text-left p-2 font-semibold">Balance</th>
                        <th className="text-left p-2 font-semibold">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fiuData.map((fiu, index) => (
                        <tr
                          key={index}
                          className="border-b border-indigo-100 dark:border-indigo-800"
                        >
                          <td className="p-2">
                            {fiu.financialInstrument?.number}
                          </td>
                          <td className="p-2">
                            {fiu.financialInstrument?.amount?.toLocaleString()}{" "}
                            {fiu.financialInstrument?.currency}
                          </td>
                          <td className="p-2">
                            {fiu.utilized?.toLocaleString()}{" "}
                            {fiu.financialInstrument?.currency}
                          </td>
                          <td className="p-2">
                            {fiu.financialInstrument?.balance?.toLocaleString()}{" "}
                            {fiu.financialInstrument?.currency}
                          </td>
                          <td className="p-2">
                            {fiu.financialInstrument?.expiryDate?.slice(0, 10)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Goods Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <FaBox className="text-gray-600" />
                Goods Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left p-2 font-semibold">Item</th>
                      <th className="text-left p-2 font-semibold">Qty</th>
                      <th className="text-left p-2 font-semibold">Per Unit</th>
                      <th className="text-left p-2 font-semibold">
                        Total Weight
                      </th>
                      <th className="text-left p-2 font-semibold">Rate/Unit</th>
                      <th className="text-left p-2 font-semibold">
                        Total Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {consignment?.goods?.map((good, index) => {
                      const totalWeight =
                        (good.weightPerUnit || 0) * (good.quantity || 0);
                      const totalAmount =
                        totalWeight * (good.commodityPerUnitCost || 0);

                      return (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="p-2">{good?.commodityItem?.name}</td>
                          <td className="p-2">
                            {good?.quantity?.toLocaleString()}
                          </td>
                          <td className="p-2">
                            {good?.weightPerUnit?.toFixed(1)} kg
                          </td>
                          <td className="p-2">
                            {totalWeight?.toLocaleString()} kg
                          </td>
                          <td className="p-2">
                            {good?.commodityPerUnitCost?.toLocaleString()}
                          </td>
                          <td className="p-2 font-semibold">
                            {totalAmount?.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final Summary */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaCalculator className="text-red-600" />
                  Cost Breakdown
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Airway Bill"
                    value={totalAirwayBill?.toLocaleString()}
                  />
                  <InfoRow
                    label="Goods Cost"
                    value={totalGoodsAmount?.toLocaleString()}
                  />
                  <InfoRow
                    label="Packing Cost"
                    value={totalPackingAmount?.toLocaleString()}
                  />
                  <InfoRow
                    label="Packaging Cost"
                    value={totalPackagingCost?.toLocaleString()}
                  />
                  <InfoRow
                    label="Custom Fee"
                    value={customFee?.toLocaleString()}
                  />
                  <InfoRow
                    label="Daily Expenses"
                    value={dailyExpenses?.toLocaleString()}
                  />
                  <div className="border-t border-red-200 dark:border-red-700 pt-2 mt-2">
                    <InfoRow
                      label="Total Cost"
                      value={totalCost?.toLocaleString()}
                      highlight
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <FaMoneyBillWave className="text-green-600" />
                  Recovery & Summary
                </h3>
                <div className="space-y-2">
                  <InfoRow
                    label="Recovery Amount"
                    value={consignment?.recoveryDone?.amount?.toLocaleString()}
                  />
                  <InfoRow
                    label="Currency"
                    value={consignment?.recoveryDone?.currency}
                  />
                  <InfoRow
                    label="Exchange Rate"
                    value={consignment?.recoveryDone?.exchangeRate}
                  />
                  <div className="border-t border-green-200 dark:border-green-700 pt-2 mt-2">
                    <InfoRow
                      label="Total Recovery"
                      value={totalRecovery?.toLocaleString()}
                      highlight
                    />
                  </div>
                  <div
                    className={`mt-4 p-3 rounded-lg ${
                      grandTotal > 0
                        ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                        : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold text-lg ${
                          grandTotal > 0
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {grandTotal > 0 ? "Profit" : "Loss"}
                      </span>
                      <span
                        className={`font-bold text-xl ${
                          grandTotal > 0
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {Math.abs(grandTotal)?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar - Action Buttons */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FaDownload className="text-blue-500" />
              Export Options
            </h3>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToExcel}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold"
              >
                <FaFileExcel className="text-lg" />
                Export to Excel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePDF}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold"
              >
                <FaFilePdf className="text-lg" />
                Download PDF
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-semibold"
              >
                <FaPrint className="text-lg" />
                Take Print
              </motion.button>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                Quick Stats
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Net Weight
                  </span>
                  <span className="font-semibold">
                    {netWeight?.toLocaleString()} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Gross Weight
                  </span>
                  <span className="font-semibold">
                    {grossWeight?.toLocaleString()} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">
                    Total Items
                  </span>
                  <span className="font-semibold">
                    {consignment?.goods?.length}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice,
          #invoice * {
            visibility: visible;
          }
          #invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

// Helper component for consistent info rows
const InfoRow = ({ label, value, highlight = false }) => (
  <div
    className={`flex justify-between items-center py-1 ${
      highlight ? "font-semibold" : ""
    }`}
  >
    <span className="text-gray-600 dark:text-gray-300">{label}:</span>
    <span
      className={`${
        highlight
          ? "text-blue-600 dark:text-blue-400 font-bold"
          : "text-gray-800 dark:text-white"
      }`}
    >
      {value || "N/A"}
    </span>
  </div>
);

export default Invoice;
