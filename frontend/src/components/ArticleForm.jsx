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
    authorId: 1 // Default author ID, should be from current user context
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề là bắt buộc';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Tiêu đề phải có ít nhất 5 ký tự';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Nội dung là bắt buộc';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Nội dung phải có ít nhất 50 ký tự';
    }

    if (formData.summary && formData.summary.length > 500) {
      newErrors.summary = 'Tóm tắt không được vượt quá 500 ký tự';
    }

    if (formData.imageUrl && formData.imageUrl.length > 1024) {
      newErrors.imageUrl = 'URL hình ảnh không được vượt quá 1024 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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
    if (window.confirm('Bạn có chắc chắn muốn hủy? Các thay đổi chưa lưu sẽ bị mất.')) {
      onCancel();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Chỉ được phép upload file ảnh');
      return;
    }

    // Validate file size (10MB)
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
      
      let errorMessage = 'Lỗi khi upload ảnh';
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra:\n- Backend có đang chạy không?\n- URL backend có đúng không?';
      } else if (err.response) {
        // Server responded with error status
        errorMessage = `Lỗi server: ${err.response.status} - ${err.response.data || err.response.statusText}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'Không nhận được phản hồi từ server. Vui lòng kiểm tra kết nối.';
      } else {
        // Something else happened
        errorMessage = `Lỗi: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          {article ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">
              Tiêu đề <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề bài viết"
            />
            {errors.title && (
              <div className="invalid-feedback">{errors.title}</div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="summary" className="form-label">
              Tóm tắt
            </label>
            <textarea
              className={`form-control ${errors.summary ? 'is-invalid' : ''}`}
              id="summary"
              name="summary"
              rows="3"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Nhập tóm tắt bài viết (tùy chọn)"
            />
            {errors.summary && (
              <div className="invalid-feedback">{errors.summary}</div>
            )}
            <div className="form-text">
              {formData.summary.length}/500 ký tự
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="imageUrl" className="form-label">
              Hình ảnh
            </label>
            
            {/* File Upload */}
            <div className="mb-2">
              <input
                type="file"
                className="form-control"
                id="fileUpload"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading && (
                <div className="mt-2">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span className="text-muted">Đang upload ảnh...</span>
                </div>
              )}
            </div>

            {/* Manual URL Input */}
            <div className="mb-2">
              <label htmlFor="imageUrl" className="form-label small text-muted">
                Hoặc nhập URL trực tiếp:
              </label>
              <input
                type="url"
                className={`form-control ${errors.imageUrl ? 'is-invalid' : ''}`}
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && (
                <div className="invalid-feedback">{errors.imageUrl}</div>
              )}
              <div className="form-text">
                {formData.imageUrl.length}/1024 ký tự
              </div>
            </div>

            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `http://localhost:8080${formData.imageUrl}`}
                  alt="Preview" 
                  className="img-thumbnail"
                  style={{ maxWidth: '200px', maxHeight: '150px' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="content" className="form-label">
              Nội dung <span className="text-danger">*</span>
            </label>
            <textarea
              className={`form-control ${errors.content ? 'is-invalid' : ''}`}
              id="content"
              name="content"
              rows="10"
              value={formData.content}
              onChange={handleChange}
              placeholder="Nhập nội dung bài viết"
            />
            {errors.content && (
              <div className="invalid-feedback">{errors.content}</div>
            )}
            <div className="form-text">
              {formData.content.length} ký tự
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="status" className="form-label">
              Trạng thái
            </label>
            <select
              className="form-select"
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Đang lưu...
                </>
              ) : (
                article ? 'Cập nhật' : 'Tạo mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
