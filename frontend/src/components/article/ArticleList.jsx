import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import articleApi from '../../api/articleApi';

const ArticleList = ({ onEdit, onDelete, searchParams }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Search params:', searchParams);
      const res = await articleApi.searchArticles(searchParams);
      const pageData = res.data;
      const content = pageData?.content || [];
      // Sort articles by ID
      setArticles(content.sort((a, b) => a.articleId - b.articleId));
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Không tải được danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [searchParams]);

  const handleDelete = async (article) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${article.title}"?`)) {
      try {
        await articleApi.deleteArticle(article.articleId);
        alert('Xóa bài viết thành công!');
        fetchArticles(); // Refresh the list
      } catch (err) {
        console.error('Error deleting article:', err);
        alert('Lỗi khi xóa bài viết: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleRestore = async (article) => {
    if (window.confirm(`Bạn có chắc chắn muốn khôi phục bài viết "${article.title}"?`)) {
      try {
        await articleApi.restoreArticle(article.articleId);
        alert('Khôi phục bài viết thành công!');
        fetchArticles(); // Refresh the list
      } catch (err) {
        console.error('Error restoring article:', err);
        alert('Lỗi khi khôi phục bài viết: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'ACTIVE': return 'Đã xuất bản';
      case 'INACTIVE': return 'Lưu trữ';
      default: return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'DRAFT': return 'bg-secondary';
      case 'ACTIVE': return 'bg-success';
      case 'INACTIVE': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Đang tải danh sách bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-file-text display-1 text-muted"></i>
        <h5 className="mt-3">Không có bài viết nào</h5>
        <p className="text-muted">Chưa có bài viết nào được tạo hoặc không tìm thấy bài viết phù hợp.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Bài viết</th>
            <th>Tác giả</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((item) => (
            <tr key={item.articleId}>
              <td>{item.articleId}</td>
              <td>
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                         style={{ width: '36px', height: '36px', fontSize: '12px', fontWeight: 'bold' }}>
                      {(item.author?.firstName?.[0] || '') + (item.author?.lastName?.[0] || '')}
                    </div>
                  </div>
                  <div>
                    <button className="btn btn-link p-0 text-start fw-semibold"
                            onClick={() => navigate(`/admin/articles/${item.articleId}`)}>
                      <span style={{ fontSize: '1.1rem' }}>{item.title}</span>
                    </button>
                    {item.content && (
                      <div className="text-muted small mt-1">
                        {item.content.length > 100 ? item.content.substring(0, 100) + '...' : item.content}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                {item.author ? `${item.author.firstName} ${item.author.lastName}` : 'N/A'}
              </td>
              <td>
                <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </td>
              <td>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </td>
              <td>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => onEdit?.(item)}
                    title="Chỉnh sửa"
                  >
                    <i className="bi bi-pencil" />
                  </button>
                  {item.status === 'INACTIVE' ? (
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => handleRestore(item)}
                      title="Khôi phục"
                    >
                      <i className="bi bi-arrow-clockwise" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => handleDelete(item)}
                      title="Xóa"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ArticleList;


