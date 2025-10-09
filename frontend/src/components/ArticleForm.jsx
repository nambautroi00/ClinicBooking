import React, { useState, useEffect } from 'react';
import articleApi from '../api/articleApi';
import fileUploadApi from '../api/fileUploadApi';

const ArticleForm = ({ article, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    imageUrl: '',
    status: 'DRAFT',
    authorId: 1
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        summary: article.summary || '',
        content: article.content || '',
        imageUrl: article.imageUrl || '',
        status: article.status || 'DRAFT',
        authorId: article.author?.id || 1
      });
    }
  }, [article]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
    if (!formData.content.trim()) newErrors.content = 'Nội dung là bắt buộc';
    if (formData.summary && formData.summary.length > 500) newErrors.summary = 'Tóm tắt tối đa 500 ký tự';
    if (formData.imageUrl && formData.imageUrl.length > 1024) newErrors.imageUrl = 'URL hình ảnh tối đa 1024 ký tự';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      let response;
      if (article) {
        response = await articleApi.updateArticle(article.articleId, formData);
      } else {
        response = await articleApi.createArticle(formData);
      }
      onSave(response.data);
      alert(article ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết thành công!');
    } catch (err) {
      console.error('Error saving article:', err);
      alert('Lỗi khi lưu bài viết: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy?')) {
      onCancel();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Chỉ được phép upload file ảnh');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 10MB');
      return;
    }
    setUploading(true);
    try {
      const response = await fileUploadApi.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        imageUrl: response.data.url
      }));
      alert('Upload ảnh thành công!');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Lỗi khi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">{article ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Tiêu đề <span className="text-danger">*</span></label>
            <input type="text" className={`form-control ${errors.title ? 'is-invalid' : ''}`} id="title" name="title" value={formData.title} onChange={handleChange} />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="summary" className="form-label">Tóm tắt</label>
            <textarea className={`form-control ${errors.summary ? 'is-invalid' : ''}`} id="summary" name="summary" rows="3" value={formData.summary} onChange={handleChange} />
            {errors.summary && <div className="invalid-feedback">{errors.summary}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="imageUrl" className="form-label">Hình ảnh</label>
            <div className="mb-2">
              <input type="file" className="form-control" id="fileUpload" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              {uploading && (
                <div className="mt-2">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span className="text-muted">Đang upload ảnh...</span>
                </div>
              )}
            </div>
            <input type="url" className={`form-control ${errors.imageUrl ? 'is-invalid' : ''}`} id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
            {errors.imageUrl && <div className="invalid-feedback">{errors.imageUrl}</div>}
            {formData.imageUrl && (
              <div className="mt-2">
                <img src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `http://localhost:8080${formData.imageUrl}`} alt="Preview" className="img-thumbnail" style={{ maxWidth: '200px', maxHeight: '150px' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="content" className="form-label">Nội dung <span className="text-danger">*</span></label>
            <textarea className={`form-control ${errors.content ? 'is-invalid' : ''}`} id="content" name="content" rows="10" value={formData.content} onChange={handleChange} />
            {errors.content && <div className="invalid-feedback">{errors.content}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="status" className="form-label">Trạng thái</label>
            <select className="form-select" id="status" name="status" value={formData.status} onChange={handleChange}>
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={loading}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{article ? 'Cập nhật' : 'Tạo mới'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;



