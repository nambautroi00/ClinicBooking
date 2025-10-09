import axiosClient from './axiosClient';

const articleApi = {
  // Get all articles with pagination
  getAllArticles: (page = 0, size = 10, sort = 'createdAt,desc') => {
    return axiosClient.get('/articles', {
      params: { page, size, sort }
    });
  },

  // Get article by ID
  getArticleById: (id) => {
    return axiosClient.get(`/articles/${id}`);
  },

  // Search articles
  searchArticles: (title, status, authorId, page = 0, size = 10, sort = 'createdAt,desc') => {
    const params = { page, size, sort };
    if (title) params.title = title;
    if (status) params.status = status;
    if (authorId) params.authorId = authorId;
    
    return axiosClient.get('/articles/search', { params });
  },

  // Create new article
  createArticle: (articleData) => {
    return axiosClient.post('/articles', articleData);
  },

  // Update article
  updateArticle: (id, articleData) => {
    return axiosClient.put(`/articles/${id}`, articleData);
  },

  // Delete article
  deleteArticle: (id) => {
    return axiosClient.delete(`/articles/${id}`);
  },

  // Approve article
  approveArticle: (id) => {
    return axiosClient.put(`/articles/${id}/approve`);
  },

  // Reject article
  rejectArticle: (id) => {
    return axiosClient.put(`/articles/${id}/reject`);
  }
};

export default articleApi;


