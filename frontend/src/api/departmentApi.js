import axiosClient from './axiosClient';

const departmentApi = {
  // Get all departments with pagination
  getAllDepartments: (page = 0, size = 10, sort = 'departmentName,asc') =>
    axiosClient.get('/departments', { params: { page, size, sort } }),
};

export default departmentApi;


