import axiosClient from './axiosClient';

// Upload file chung
function uploadFile(formData) {
  return axiosClient.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// Upload ảnh avatar chuyên biệt (nếu backend có)
function uploadAvatar(formData) {
  return axiosClient.post('/files/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export default {
  uploadFile,
  uploadAvatar,
};



