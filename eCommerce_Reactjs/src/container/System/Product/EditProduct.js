import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import { useFetchAllcode } from '../../customize/fetch';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { getDetailProductByIdService, UpdateProductService } from '../../../services/userService';

const mdParser = new MarkdownIt();

const EditProduct = () => {
  const { id } = useParams();
  const { data: dataBrand } = useFetchAllcode('BRAND');
  const { data: dataCategory } = useFetchAllcode('CATEGORY');
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    brandId: '',
    categoryId: '',
    name: '',
    contentHTML: '',
    contentMarkdown: '',
    madeby: '',
    material: '',
  });

  useEffect(() => {
    getDetailProductByIdService(id).then((res) => {
      if (res?.errCode === 0) {
        const d = res.data;
        setValues({
          brandId: d.brandId,
          categoryId: d.categoryId,
          name: d.name,
          contentHTML: d.contentHTML,
          contentMarkdown: d.contentMarkdown,
          madeby: d.madeby,
          material: d.material,
        });
      }
    });
  }, [id]);

  const handleChange = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!values.name) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    setLoading(true);
    try {
      const res = await UpdateProductService({ ...values, id });
      if (res?.errCode === 0) toast.success('Cập nhật sản phẩm thành công');
      else toast.error(res?.errMessage || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              <i className="fa-solid fa-pen-to-square"></i>Cập nhật sản phẩm
            </div>
            <div className="ap-page-subtitle">Chỉnh sửa thông tin sản phẩm #{id}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/admin/list-product-detail/${id}`} className="ap-btn ap-btn-ghost">
              🧩 Quản lý phân loại
            </Link>
            <Link to="/admin/list-product" className="ap-btn ap-btn-ghost">
              ← Quay lại
            </Link>
          </div>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header">
          <span className="ap-card-title">
            <i className="fa-solid fa-bag-shopping" style={{ marginRight: 8 }}></i>Thông tin cơ bản
          </span>
        </div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group" style={{ flex: 2 }}>
              <label className="ap-label">Tên sản phẩm *</label>
              <input
                className="ap-input"
                name="name"
                value={values.name}
                onChange={handleChange}
                placeholder="Nhập tên sản phẩm..."
              />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Chất liệu</label>
              <input
                className="ap-input"
                name="material"
                value={values.material}
                onChange={handleChange}
                placeholder="VD: Cotton, Polyester..."
              />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Xuất xứ</label>
              <input
                className="ap-input"
                name="madeby"
                value={values.madeby}
                onChange={handleChange}
                placeholder="VD: Việt Nam, Trung Quốc..."
              />
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Danh mục sản phẩm</label>
              <select
                className="ap-select"
                name="categoryId"
                value={values.categoryId}
                onChange={handleChange}
              >
                {dataCategory?.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Nhãn hàng</label>
              <select
                className="ap-select"
                name="brandId"
                value={values.brandId}
                onChange={handleChange}
              >
                {dataBrand?.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ap-form-group">
            <label className="ap-label">Mô tả sản phẩm (Markdown)</label>
            <div
              style={{
                borderRadius: 'var(--ap-radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--ap-border)',
              }}
            >
              <MdEditor
                style={{ height: '400px' }}
                renderHTML={(text) => mdParser.render(text)}
                onChange={({ html, text }) =>
                  setValues((v) => ({ ...v, contentMarkdown: text, contentHTML: html }))
                }
                value={values.contentMarkdown}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang cập nhật...' : '💾 Lưu thay đổi'}
            </button>
            <Link to="/admin/list-product" className="ap-btn ap-btn-ghost">
              Hủy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EditProduct;
