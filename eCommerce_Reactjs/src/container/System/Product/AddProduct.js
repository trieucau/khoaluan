import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useFetchAllcode } from '../../customize/fetch';
import CommonUtils from '../../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { CreateNewProduct } from '../../../services/userService';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const INITIAL = { brandId:'', categoryId:'', sizeId:'', name:'', material:'', madeby:'', contentHTML:'', contentMarkdown:'', nameDetail:'', width:'', height:'', weight:'', originalPrice:'', discountPrice:'', description:'', image:'', imageReview:'' };

const AddProduct = () => {
  const { data: dataBrand } = useFetchAllcode('BRAND');
  const { data: dataCategory } = useFetchAllcode('CATEGORY');
  const { data: dataSize } = useFetchAllcode('SIZE');
  const [values, setValues] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (dataBrand?.length && dataCategory?.length && dataSize?.length && !values.brandId) {
      setValues(v => ({ ...v, brandId: dataBrand[0].code, categoryId: dataCategory[0].code, sizeId: dataSize[0].code }));
    }
  }, [dataBrand, dataCategory, dataSize]);

  const set = (name, val) => setValues(v => ({ ...v, [name]: val }));
  const handleChange = e => set(e.target.name, e.target.value);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 31312281) { toast.error('Dung lượng file phải < 30MB'); return; }
    const base64 = await CommonUtils.getBase64(file);
    setValues(v => ({ ...v, image: base64, imageReview: URL.createObjectURL(file) }));
  };

  const discountPct = values.originalPrice && values.discountPrice
    ? Math.round((1 - values.discountPrice / values.originalPrice) * 100) : 0;

  const handleSave = async () => {
    if (!values.name || !values.nameDetail) { toast.error('Vui lòng nhập tên sản phẩm và loại sản phẩm'); return; }
    setLoading(true);
    try {
      const res = await CreateNewProduct({ name: values.name, description: values.description, categoryId: values.categoryId, madeby: values.madeby, material: values.material, brandId: values.brandId, width: values.width, height: values.height, sizeId: values.sizeId, originalPrice: values.originalPrice, discountPrice: values.discountPrice, image: values.image, nameDetail: values.nameDetail, contentMarkdown: values.contentMarkdown, contentHTML: values.contentHTML, weight: values.weight });
      if (res?.errCode === 0) {
        toast.success('Tạo mới sản phẩm thành công!');
        setValues(v => ({ ...INITIAL, brandId: v.brandId, categoryId: v.categoryId, sizeId: v.sizeId }));
      } else toast.error(res?.errMessage || 'Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">🛍️ Thêm sản phẩm mới</div>
            <div className="ap-page-subtitle">Tạo sản phẩm với đầy đủ thông tin, phân loại và hình ảnh</div>
          </div>
          <Link to="/admin/list-product" className="ap-btn ap-btn-ghost">← Danh sách sản phẩm</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Basic info */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">📋 Thông tin cơ bản</span></div>
            <div className="ap-card-body">
              <div className="ap-form-row">
                <div className="ap-form-group" style={{ flex: 2 }}>
                  <label className="ap-label">Tên sản phẩm *</label>
                  <input className="ap-input" name="name" value={values.name} onChange={handleChange} placeholder="VD: Áo Thun Nam Premium..." />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Danh mục</label>
                  <select className="ap-select" name="categoryId" value={values.categoryId} onChange={handleChange}>
                    {dataCategory?.map(c => <option key={c.code} value={c.code}>{c.value}</option>)}
                  </select>
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Nhãn hàng</label>
                  <select className="ap-select" name="brandId" value={values.brandId} onChange={handleChange}>
                    {dataBrand?.map(b => <option key={b.code} value={b.code}>{b.value}</option>)}
                  </select>
                </div>
              </div>
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label className="ap-label">Chất liệu</label>
                  <input className="ap-input" name="material" value={values.material} onChange={handleChange} placeholder="VD: Cotton 100%..." />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Xuất xứ</label>
                  <input className="ap-input" name="madeby" value={values.madeby} onChange={handleChange} placeholder="VD: Việt Nam..." />
                </div>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Mô tả ngắn</label>
                <textarea className="ap-input" rows={3} name="description" value={values.description} onChange={handleChange} placeholder="Mô tả nhanh sản phẩm..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Markdown description */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">📝 Mô tả chi tiết (Markdown)</span></div>
            <div className="ap-card-body" style={{ padding: 0 }}>
              <div style={{ borderRadius: 'var(--ap-radius-sm)', overflow: 'hidden' }}>
                <MdEditor style={{ height: 360 }} renderHTML={t => mdParser.render(t)}
                  onChange={({ html, text }) => setValues(v => ({ ...v, contentMarkdown: text, contentHTML: html }))}
                  value={values.contentMarkdown} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Variant */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">🧩 Phân loại sản phẩm</span></div>
            <div className="ap-card-body">
              <div className="ap-form-group">
                <label className="ap-label">Tên loại *</label>
                <input className="ap-input" name="nameDetail" value={values.nameDetail} onChange={handleChange} placeholder="VD: Màu đen, Size M..." />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Kích thước mặc định</label>
                <select className="ap-select" name="sizeId" value={values.sizeId} onChange={handleChange}>
                  {dataSize?.map(s => <option key={s.code} value={s.code}>{s.value}</option>)}
                </select>
              </div>
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label className="ap-label">Giá gốc (VNĐ)</label>
                  <input className="ap-input" type="number" name="originalPrice" value={values.originalPrice} onChange={handleChange} placeholder="150000" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Giá KM (VNĐ)</label>
                  <input className="ap-input" type="number" name="discountPrice" value={values.discountPrice} onChange={handleChange} placeholder="120000" />
                </div>
              </div>
              {discountPct > 0 && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#6ee7b7' }}>
                  🏷️ Giảm <strong>{discountPct}%</strong> — tiết kiệm {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(values.originalPrice - values.discountPrice)}
                </div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">📐 Kích thước & trọng lượng</span></div>
            <div className="ap-card-body">
              <div className="ap-form-row">
                <div className="ap-form-group">
                  <label className="ap-label">Rộng (cm)</label>
                  <input className="ap-input" name="width" value={values.width} onChange={handleChange} placeholder="30" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Dài (cm)</label>
                  <input className="ap-input" name="height" value={values.height} onChange={handleChange} placeholder="40" />
                </div>
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Khối lượng (g)</label>
                <input className="ap-input" name="weight" value={values.weight} onChange={handleChange} placeholder="200" />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="ap-card">
            <div className="ap-card-header"><span className="ap-card-title">🖼️ Hình ảnh sản phẩm</span></div>
            <div className="ap-card-body">
              <input type="file" id="prodImg" accept=".jpg,.png,.webp" hidden onChange={handleImageChange} />
              <label htmlFor="prodImg" className="ap-btn ap-btn-ghost" style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
                📤 Chọn ảnh (JPG/PNG/WEBP ≤ 30MB)
              </label>
              {values.imageReview && (
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                  <img src={values.imageReview} alt="preview" onClick={() => setLightboxOpen(true)}
                    style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 'var(--ap-radius-sm)', cursor: 'zoom-in', border: '1px solid var(--ap-border)' }} />
                  <div style={{ fontSize: 11, color: 'var(--ap-text-dim)', marginTop: 4 }}>Click để phóng to</div>
                </div>
              )}
            </div>
          </div>

          <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 15 }}>
            {loading ? '⏳ Đang tạo sản phẩm...' : '🚀 Tạo sản phẩm'}
          </button>
        </div>
      </div>

      {lightboxOpen && <Lightbox slides={[{ src: values.imageReview }]} open={lightboxOpen} close={() => setLightboxOpen(false)} />}
    </div>
  );
};
export default AddProduct;
