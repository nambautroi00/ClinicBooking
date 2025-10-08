import React, { useState, useEffect } from 'react';
import articleApi from '../api/articleApi';

const ArticleList = ({ onEdit, onDelete, searchParams }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadArticles = async (page = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchParams && (searchParams.title || searchParams.status || searchParams.authorId)) {
        response = await articleApi.searchArticles(
          searchParams.title,
          searchParams.status,
          searchParams.authorId,
          page,
          10,
          'createdAt,desc'
        );
      } else {
        response = await articleApi.getAllArticles(page, 10, 'createdAt,desc');
      }

      setArticles(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setCurrentPage(page);
    } catch (err) {
      setError('Lỗi khi tải danh sách bài viết');
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles(0);
  }, [searchParams]);

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await articleApi.deleteArticle(id);
        loadArticles(currentPage);
        alert('Xóa bài viết thành công!');
      } catch (err) {
        alert('Lỗi khi xóa bài viết');
        console.error('Error deleting article:', err);
      }
    }
  };

  const handlePageChange = (newPage) => {
    loadArticles(newPage);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'DRAFT': { class: 'bg-secondary', text: 'Nháp' },
      'PUBLISHED': { class: 'bg-success', text: 'Đã xuất bản' },
      'ARCHIVED': { class: 'bg-warning', text: 'Lưu trữ' }
    };
    
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
    
    return (
      <span className={`badge ${statusInfo.class} text-white`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-2" 
          onClick={() => loadArticles(currentPage)}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Danh sách bài viết ({totalElements} bài viết)</h5>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted">Không có bài viết nào</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Tác giả</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày cập nhật</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.articleId}>
                    <td>
                      {article.imageUrl ? (
                        <img 
                          src={article.imageUrl.startsWith('http') ? article.imageUrl : `http://localhost:8080${article.imageUrl}`}
                          alt={article.title}
                          className="img-thumbnail"
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <div 
                        className="text-muted small d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          display: article.imageUrl ? 'none' : 'flex',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <i className="bi bi-image"></i>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{article.title}</strong>
                        {article.summary && (
                          <div className="text-muted small mt-1">
                            {article.summary.length > 100 
                              ? `${article.summary.substring(0, 100)}...` 
                              : article.summary}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {article.author ? `${article.author.firstName} ${article.author.lastName}` : 'N/A'}
                    </td>
                    <td>{getStatusBadge(article.status)}</td>
                    <td>{formatDate(article.createdAt)}</td>
                    <td>{formatDate(article.updatedAt)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEdit(article)}
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(article.articleId)}
                          title="Xóa"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Article pagination">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Trước
                  </button>
                </li>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, currentPage - 2) + i;
                  if (pageNum >= totalPages) return null;
                  
                  return (
                    <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    </li>
                  );
                })}
                
                <li className={`page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default ArticleList;
