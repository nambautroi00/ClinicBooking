import axiosClient from './axiosClient';

const fileUploadApi = {
  uploadImage: (file, id = null, type = 'article') => {
    const formData = new FormData();
    formData.append('file', file);
    if (id) {
      if (type === 'doctor') {
        formData.append('doctorId', id);
      } else if (type === 'user') {
        formData.append('userId', id);
      } else if (type === 'message') {
        formData.append('messageId', id);
      } else {
        formData.append('articleId', id);
      }
    }

    return axiosClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default fileUploadApi;



