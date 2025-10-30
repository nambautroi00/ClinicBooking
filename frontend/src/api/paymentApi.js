import axiosClient from "./axiosClient";

const paymentApi = {
  exportInvoicePdf: (id) =>
    axiosClient.get(`/payments/${id}/invoice-pdf`, { responseType: "blob" }),
};

export default paymentApi;
