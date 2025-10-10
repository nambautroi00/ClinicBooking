import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import articleApi from '../../api/articleApi';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
              <p className="mt-2">Đang tải bài viết...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger text-center">
              <h4>Không tìm thấy bài viết</h4>
              <p>{error || 'Bài viết không tồn tại hoặc đã bị xóa.'}</p>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/admin/articles')}
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <button 
                  className="btn btn-link p-0 text-decoration-none" 
                  onClick={() => navigate('/admin/articles')}
                >
                  Quản lý bài viết
                </button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Chi tiết bài viết
              </li>
            </ol>
          </nav>

          <div className="card shadow-sm">
            <div className="card-body p-4">
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <div className="me-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                      {article.author?.firstName?.charAt(0)}{article.author?.lastName?.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">
                      {article.author?.firstName} {article.author?.lastName}
                    </div>
                    <small className="text-muted">
                      {formatDate(article.createdAt)}
                    </small>
                  </div>
                  <div className="ms-auto">
                    <span className={`badge ${article.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                      {article.status === 'ACTIVE' ? 'Đã xuất bản' : 'Lưu trữ'}
                    </span>
                  </div>
                </div>

                <h1 className="card-title mt-2" style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  lineHeight: '1.3'
                }}>
                  {article.title}
                </h1>
              </div>

              <div className="article-content" style={{ 
                fontSize: '1.1rem', 
                lineHeight: '1.8',
                color: '#34495e'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {article.content}
                </div>
              </div>

              {getImageUrl(article.imageUrl) && (
                <div className="mt-4">
                  <img 
                    src={getImageUrl(article.imageUrl)} 
                    alt={article.title}
                    className="img-fluid rounded"
                    style={{ 
                      width: '100%', 
                      maxHeight: '500px',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-start">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/admin/articles')}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại danh sách
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-6">
              <div className="card">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-info-circle me-2"></i>
                    Thông tin bài viết
                  </h6>
                  <ul className="list-unstyled mb-0">
                    <li><strong>ID:</strong> {article.articleId}</li>
                    <li><strong>Tác giả:</strong> {article.author?.firstName} {article.author?.lastName}</li>
                    <li><strong>Email:</strong> {article.author?.email}</li>
                    <li><strong>Ngày tạo:</strong> {formatDate(article.createdAt)}</li>
                    <li><strong>Trạng thái:</strong> {article.status}</li>
                  </ul>
                </div>
              </div>
            </div>

            {getImageUrl(article.imageUrl) && (
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-image me-2"></i>
                      Hình ảnh bài viết
                    </h6>
                    <div className="text-center">
                      <img 
                        src={getImageUrl(article.imageUrl)} 
                        alt={article.title}
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
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



