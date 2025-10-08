import axiosClient from './axiosClient';

const articleApi = {
  // Get all articles with pagination
  getAllArticles: (page = 0, size = 10, sort = 'createdAt,desc') => {
    return axiosClient.get('/api/articles', {
      params: { page, size, sort }
    });
  },

  // Get article by ID
  getArticleById: (id) => {
    return axiosClient.get(`/api/articles/${id}`);
  },

  // Search articles
  searchArticles: (title, status, authorId, page = 0, size = 10, sort = 'createdAt,desc') => {
    const params = { page, size, sort };
    if (title) params.title = title;
    if (status) params.status = status;
    if (authorId) params.authorId = authorId;
    
    return axiosClient.get('/api/articles/search', { params });
  },

  // Create new article
  createArticle: (articleData) => {
    return axiosClient.post('/api/articles', articleData);
  },

  // Update article
  updateArticle: (id, articleData) => {
    return axiosClient.put(`/api/articles/${id}`, articleData);
  },

  // Delete article
  deleteArticle: (id) => {
    return axiosClient.delete(`/api/articles/${id}`);
  }
};

export default articleApi;


