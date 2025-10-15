import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Heart, Eye } from 'lucide-react';
import articleApi from '../api/articleApi';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [likedArticles, setLikedArticles] = useState(new Set());

  const fetchArticles = async (page = 0, search = '') => {
    try {
      setLoading(true);
      const searchParams = {
        title: search,
        status: 'ACTIVE' // Chỉ lấy bài viết đã được xuất bản
      };
      
      const response = await articleApi.searchArticles(searchParams, page, 12, 'createdAt,desc');
      const pageData = response.data;
      
      setArticles(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(0, searchTerm);
  };

  const handlePageChange = (page) => {
    fetchArticles(page, searchTerm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      if (diffInMinutes < 1) {
        return 'Vừa xong';
      }
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
      } else {
        return date.toLocaleDateString('vi-VN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };


  const handleLike = async (articleId) => {
    try {
      const isLiked = likedArticles.has(articleId);
      if (isLiked) {
        await articleApi.unlikeArticle(articleId);
        setLikedArticles(prev => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
        // Cập nhật likeCount trong articles
        setArticles(prev => prev.map(article => 
          article.articleId === articleId 
            ? { ...article, likeCount: Math.max(0, (article.likeCount || 0) - 1) }
            : article
        ));
      } else {
        await articleApi.likeArticle(articleId);
        setLikedArticles(prev => new Set(prev).add(articleId));
        // Cập nhật likeCount trong articles
        setArticles(prev => prev.map(article => 
          article.articleId === articleId 
            ? { ...article, likeCount: (article.likeCount || 0) + 1 }
            : article
        ));
      }
    } catch (err) {
      console.error('Error liking article:', err);
      alert('Lỗi khi thả tim: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button 
              onClick={() => fetchArticles()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Bài viết y tế</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Cập nhật những thông tin y tế mới nhất, lời khuyên từ chuyên gia và kiến thức chăm sóc sức khỏe
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mt-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                Tìm kiếm
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="container mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {searchTerm ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
            </div>
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  fetchArticles(0, '');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Xem tất cả bài viết
              </button>
            )}
          </div>
        ) : (
          <>

            <div className="max-w-2xl mx-auto space-y-6">
              {articles.map((article) => (
                <div key={article.articleId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Article Header */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* Author Avatar */}
                      {article.author?.avatarUrl ? (
                        <img
                          src={article.author.avatarUrl}
                          alt={`${article.author.firstName} ${article.author.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm" style={{ display: article.author?.avatarUrl ? 'none' : 'flex' }}>
                        {article.author?.firstName?.charAt(0)}{article.author?.lastName?.charAt(0)}
                      </div>
                      
                      {/* Author Info */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {article.author?.firstName} {article.author?.lastName}
                        </h4>
                        <span className="text-sm text-gray-500">{formatDate(article.createdAt)}</span>
                      </div>
                      
                      {/* More Options */}
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Article Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link 
                        to={`/articles/${article.articleId}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    
                    <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {article.content}
                    </div>
                  </div>

                  {/* Article Image */}
                  {getImageUrl(article.imageUrl) && (
                    <div className="w-full -mx-4">
                      <img
                        src={getImageUrl(article.imageUrl)}
                        alt={article.title}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Article Stats */}
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{article.likeCount || 0}</span>
                        </div>
                      </div>
                      
                      <Link
                        to={`/articles/${article.articleId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Đọc tiếp
                      </Link>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => handleLike(article.articleId)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                          likedArticles.has(article.articleId) ? 'text-red-500' : 'text-gray-500'
                        }`}
                      >
                        <Heart 
                          className={`h-5 w-5 ${
                            likedArticles.has(article.articleId) ? 'fill-current text-red-500' : 'text-gray-500'
                          }`} 
                        />
                        <span className={`text-sm font-medium ${
                          likedArticles.has(article.articleId) ? 'text-red-500' : 'text-gray-700'
                        }`}>
                          {likedArticles.has(article.articleId) ? 'Đã thích' : 'Thích'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page + 1}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Articles;
