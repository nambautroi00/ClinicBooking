import React, { useEffect, useState } from 'react';
import articleApi from '../api/articleApi';

const ArticleList = ({ onEdit, onDelete, searchParams }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await articleApi.searchArticles(
        searchParams?.title,
        searchParams?.status,
        searchParams?.authorId
      );
      const pageData = res.data;
      const content = pageData?.content || [];
      setArticles(content);
    } catch (err) {
      console.error('Error fetching articles', err);
      setError('Không tải được danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div>
      {loading && <div>Đang tải...</div>}
      {error && <div className="text-danger mb-2">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th style={{width: 60}}>ID</th>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Tác giả</th>
                <th style={{width: 140}} className="text-end">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(item => (
                <tr key={item.articleId}>
                  <td>{item.articleId}</td>
                  <td>{item.title}</td>
                  <td>
                    <span className="badge bg-secondary">{item.status}</span>
                  </td>
                  <td>{item.author?.fullName || item.author?.username || item.author?.id}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-primary" onClick={() => onEdit?.(item)}>
                        <i className="bi bi-pencil" />
                      </button>
                      <button className="btn btn-outline-danger" onClick={() => onDelete?.(item)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Không có bài viết</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArticleList;



