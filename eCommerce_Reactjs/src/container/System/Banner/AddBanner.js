import React, { useEffect, useState } from 'react';
import { createNewBannerService, getDetailBannerByIdService, updateBannerService } from '../../../services/userService';
import CommonUtils from '../../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';

const AddBanner = () => {
  const { id } = useParams();
  const [isAdd, setIsAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [values, setValues] = useState({ name: '', description: '', image: '', imageReview: '' });

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailBannerByIdService(id).then(res => {
        if (res?.errCode === 0) setValues({ name: res.data.name, description: res.data.description, image: res.data.image, imageReview: res.data.image });
      });
    }
  }, [id]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 31312281) { toast.error('Dung lượng file phải < 30MB'); return; }
    const base64 = await CommonUtils.getBase64(file);
    setValues(v => ({ ...v, image: base64, imageReview: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    if (!values.name) { toast.error('Vui lòng nhập tên banner'); return; }
    if (!values.image) { toast.error('Vui lòng chọn hình ảnh'); return; }
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewBannerService({ name: values.name, description: values.description, image: values.image })
        : await updateBannerService({ name: values.name, description: values.description, image: values.image, id });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Tạo banner thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ name: '', description: '', image: '', imageReview: '' });
      } else toast.error(res?.errMessage || 'Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? '🖼️ Thêm Banner' : '✏️ Cập nhật Banner'}</div>
            <div className="ap-page-subtitle">Quản lý hình ảnh quảng cáo trang chủ</div>
          </div>
          <Link to="/admin/list-banner" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div className="ap-card">
          <div className="ap-card-header"><span className="ap-card-title">📋 Thông tin Banner</span></div>
          <div className="ap-card-body">
            <div className="ap-form-group">
              <label className="ap-label">Tên Banner *</label>
              <input className="ap-input" value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))} placeholder="VD: Banner mùa hè 2025..." />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Mô tả</label>
              <textarea className="ap-input" rows={4} value={values.description}
                onChange={e => setValues(v => ({ ...v, description: e.target.value }))}
                placeholder="Ghi chú nội bộ..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? '⏳ Đang lưu...' : '💾 Lưu Banner'}
              </button>
              <Link to="/admin/list-banner" className="ap-btn ap-btn-ghost">Hủy</Link>
            </div>
          </div>
        </div>
        <div className="ap-card">
          <div className="ap-card-header"><span className="ap-card-title">🖼️ Hình ảnh</span></div>
          <div className="ap-card-body">
            <input type="file" id="bannerImg" accept=".jpg,.png,.webp" hidden onChange={handleImageChange} />
            <label htmlFor="bannerImg" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, border:'2px dashed var(--ap-border)', borderRadius:'var(--ap-radius)', padding:24, cursor:'pointer' }}>
              <div style={{ fontSize: 36 }}>📤</div>
              <div style={{ fontWeight: 600 }}>Click để chọn ảnh</div>
              <div style={{ fontSize: 12, color: 'var(--ap-text-dim)' }}>JPG/PNG/WEBP · ≤ 30MB</div>
              <div style={{ fontSize: 11, color: 'var(--ap-text-dim)' }}>Khuyến nghị: 1920 × 600px</div>
            </label>
            {values.imageReview && (
              <div style={{ marginTop: 12, position: 'relative' }}>
                <img src={values.imageReview} alt="banner" onClick={() => setLightboxOpen(true)}
                  style={{ width:'100%', borderRadius:'var(--ap-radius-sm)', objectFit:'cover', maxHeight:160, cursor:'zoom-in', border:'1px solid var(--ap-border)' }} />
                <label htmlFor="bannerImg" className="ap-btn ap-btn-ghost ap-btn-sm"
                  style={{ position:'absolute', top:8, right:8, cursor:'pointer' }}>🔄</label>
              </div>
            )}
          </div>
        </div>
      </div>
      {lightboxOpen && <Lightbox slides={[{ src: values.imageReview }]} open={lightboxOpen} close={() => setLightboxOpen(false)} />}
    </div>
  );
};
export default AddBanner;
