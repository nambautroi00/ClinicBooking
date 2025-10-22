import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Heart, Eye, ArrowRight } from 'lucide-react';
import articleApi from '../../api/articleApi';
import { getFullAvatarUrl } from '../../utils/avatarUtils';

const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestArticles = async () => {
      try {
        setLoading(true);
        const searchParams = {
          status: 'ACTIVE'
        };
        
        const response = await articleApi.searchArticles(searchParams, 0, 3, 'createdAt,desc');
        const pageData = response.data;
        setArticles(pageData.content || []);
      } catch (err) {
        console.error('Error fetching latest articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

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
          day: 'numeric'
        });
      }
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bài viết sức khỏe mới nhất
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Cập nhật những thông tin sức khỏe hữu ích và lời khuyên từ các chuyên gia y tế
          </p>
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articles.map((article) => (
              <div key={article.articleId} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Article Image */}
                {getImageUrl(article.imageUrl) && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={getImageUrl(article.imageUrl)}
                      alt={article.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="p-6">
                  {/* Author Info */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center space-x-3">
                      {article.author?.avatarUrl ? (
                        <img
                          src={getFullAvatarUrl(article.author.avatarUrl)}
                          alt={`${article.author.firstName} ${article.author.lastName}`}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs" style={{ display: article.author?.avatarUrl ? 'none' : 'flex' }}>
                        {article.author?.firstName?.charAt(0)}{article.author?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {article.author?.firstName} {article.author?.lastName}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(article.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Article Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    <Link 
                      to={`/articles/${article.articleId}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h3>

                  {/* Article Excerpt */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.content && article.content.length > 150 
                      ? article.content.substring(0, 150) + '...' 
                      : article.content
                    }
                  </p>

                  {/* Article Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span>{article.likeCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.viewCount || 0}</span>
                      </div>
                    </div>
                    <Link 
                      to={`/articles/${article.articleId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      Đọc thêm
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Chưa có bài viết nào được xuất bản</p>
          </div>
        )}

        {/* View All Button */}
        <div className="text-center">
          <Link
            to="/articles"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Xem tất cả bài viết
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
