import axios from "axios";
import { getCookie } from "cookies-next";
import axiosInstance from "@utils/axiosConfig";
export const apiURL = process.env.NEXT_PUBLIC_API_URL;
export const api_endpoint = {
  consignments: `${apiURL}/consignments`,
  consignmetitem: `${apiURL}/consignmetitem`,
  commodity: `${apiURL}/commodity`,
  consignee: `${apiURL}/consignee`,
  trader: `${apiURL}/trader`,
  packer: `${apiURL}/packer`,
  packaging: `${apiURL}/packaging`,
  IataAgent: `${apiURL}/iata-agent`,
  customAgent: `${apiURL}/custom-agent`,
};

// ✅ Function to get Axios instance with Authorization
// const getAxiosInstance = () => {
//   const token = getCookie("token");

//   return axios.create({
//     baseURL: apiURL,
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: token ? `Bearer ${token}` : "", // Include token in header
//     },
//   });
// };

// ✅ API Requests with Authentication

export const createConsignment = async (consignmentData) => {
  const response = await axiosInstance.post("/consignment", consignmentData);
  return response.data;
};

export const fetchConsignments = async () => {
  const response = await axiosInstance.get("/consignment");
  return response.data;
};

export const fetchConsignmentById = async (id) => {
  const response = await axiosInstance.get(`/consignment/${id}`);
  return response.data;
};

export const deleteConsignment = async (id) => {
  await axiosInstance.delete(`/consignment/${id}`);
};

export const fetchConsignees = async () => {
  const response = await axiosInstance.get("/consignee");
  return response.data;
};
export const fetchConsignmentItem = async () => {
  const response = await axiosInstance.get("/consignmentitem");
  return response.data;
};
export const fetchCommodity = async () => {
  const response = await axiosInstance.get("/commodity");
  return response.data;
};

export const fetchTraders = async () => {
  const response = await axiosInstance.get("/trader");
  return response.data;
};

export const fetchPackers = async () => {
  const response = await axiosInstance.get("/packer");
  return response.data;
};

export const fetchPackaging = async () => {
  const response = await axiosInstance.get("/packaging");
  return response.data;
};

export const fetchIata = async () => {
  const response = await axiosInstance.get("/iata-agent");
  return response.data;
};

export const fetchCustomAgents = async () => {
  const response = await axiosInstance.get("/custom-agent");
  return response.data;
};

export const fetchFinancialInstrument = async () => {
  const response = await axiosInstance.get("/financialinstrument");
  return response.data;
};

export const fetchGoodsDeclarations = async () => {
  const response = await axiosInstance.get("/goods-declaration");
  return response.data;
};

export const fetchFiu = async () => {
  const response = await axiosInstance.get("/utilization");
  return response.data;
};
