import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Heart, Eye, Clock } from 'lucide-react';
import articleApi from '../../api/articleApi';
import { toast } from '../../utils/toast';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  // Kiểm tra trạng thái đăng nhập và localStorage
  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        setCurrentUser(user);
        
        // Kiểm tra trạng thái tim trong localStorage
        const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
        setIsLiked(likedArticles.includes(parseInt(id)));
      } catch (err) {
        console.error('Error parsing user data:', err);
        setCurrentUser(null);
      }
    }
  }, [id]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await articleApi.getArticleById(id);
        setArticle(response.data);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Không tải được bài viết');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

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

  const handleLike = async () => {
    if (isLiking) return;
    
    // Kiểm tra đăng nhập
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để thả tim bài viết!');
      return;
    }
    
    try {
      setIsLiking(true);
      const response = await articleApi.likeArticle(id);
      setArticle(response.data);
      
      // Cập nhật localStorage
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
      if (!likedArticles.includes(parseInt(id))) {
        likedArticles.push(parseInt(id));
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Error liking article:', err);
      alert('Lỗi khi like bài viết: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlike = async () => {
    if (isLiking) return;
    
    // Kiểm tra đăng nhập
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập để bỏ tim bài viết!');
      return;
    }
    
    try {
      setIsLiking(true);
      const response = await articleApi.unlikeArticle(id);
      setArticle(response.data);
      
      // Cập nhật localStorage
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
      const updatedLikedArticles = likedArticles.filter(articleId => articleId !== parseInt(id));
      localStorage.setItem('likedArticles', JSON.stringify(updatedLikedArticles));
      setIsLiked(false);
    } catch (err) {
      console.error('Error unliking article:', err);
      alert('Lỗi khi unlike bài viết: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsLiking(false);
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

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bài viết</h2>
              <p className="text-gray-600 mb-6">{error || 'Bài viết không tồn tại hoặc đã bị xóa.'}</p>
              <Link 
                to="/articles"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách bài viết
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/articles')}
              className="btn btn-outline-secondary"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Quay lại danh sách
            </button>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Article Header */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center space-x-3">
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
                  <div>
                    <div className="font-semibold text-gray-900">
                      {article.author?.firstName} {article.author?.lastName}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(article.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="ml-auto">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    article.status === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {article.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Lưu trữ'}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-6">
                {article.title}
              </h1>

              {/* Article Content ngay dưới title */}
              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                  {article.content}
                </div>
              </div>
            </div>

            {/* Article Image */}
            {getImageUrl(article.imageUrl) && (
              <div className="px-6 pb-6">
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={getImageUrl(article.imageUrl)} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Article Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>{article.likeCount || 0} lượt thích</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!currentUser ? (
                    <button 
                      className="flex items-center px-3 py-1 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                      onClick={() => toast.info('Vui lòng đăng nhập để thả tim bài viết!')}
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Thả tim
                    </button>
                  ) : isLiked ? (
                    <button 
                      className="flex items-center px-3 py-1 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                      onClick={handleUnlike}
                      disabled={isLiking}
                    >
                      {isLiking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                      ) : (
                        <Heart className="h-4 w-4 mr-1 fill-current" />
                      )}
                      Bỏ tim
                    </button>
                  ) : (
                    <button 
                      className="flex items-center px-3 py-1 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                      onClick={handleLike}
                      disabled={isLiking}
                    >
                      {isLiking ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1"></div>
                      ) : (
                        <Heart className="h-4 w-4 mr-1" />
                      )}
                      Thả tim
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Article Info Sidebar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bài viết</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-medium">{article.articleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tác giả:</span>
                  <span className="font-medium">{article.author?.firstName} {article.author?.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{article.author?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày tạo:</span>
                  <span className="font-medium">{formatDate(article.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className="font-medium">{article.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lượt thích:</span>
                  <span className="font-medium">{article.likeCount || 0}</span>
                </div>
              </div>
            </div>

            {getImageUrl(article.imageUrl) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hình ảnh bài viết</h3>
                <div className="text-center">
                  <img 
                    src={getImageUrl(article.imageUrl)} 
                    alt={article.title}
                    className="w-full max-h-48 object-cover rounded-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;



