import axiosClient from './axiosClient';

const fileUploadApi = {
  uploadImage: (file, articleId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (articleId) {
      formData.append('articleId', articleId);
    }

    return axiosClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default fileUploadApi;



