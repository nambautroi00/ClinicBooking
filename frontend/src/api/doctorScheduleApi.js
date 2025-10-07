import axiosClient from './axiosClient';

export const getDoctorSchedules = (doctorId) => {
  return axiosClient.get(`/doctor-schedules?doctorId=${doctorId}`);
};