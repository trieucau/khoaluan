import React, { useEffect, useState } from 'react';
import { createAllCodeService, getDetailAllcodeById, UpdateAllcodeService } from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';

const AddSubject = () => {
  const [isAdd, setIsAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ value: '', code: '' });
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailAllcodeById(id).then(res => {
        if (res?.errCode === 0) setValues({ value: res.data.value, code: res.data.code });
      });
    }
  }, [id]);

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!values.value || !values.code) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setLoading(true);
    try {
      const res = isAdd
        ? await createAllCodeService({ value: values.value, code: values.code, type: 'SUBJECT' })
        : await UpdateAllcodeService({ value: values.value, code: values.code, id });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Thêm chủ đề thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ value: '', code: '' });
      } else if (res?.errCode === 2) toast.error(res.errMessage);
      else toast.error('Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? <><i className="fa-solid fa-plus" style={{marginRight: 6}}></i>Thêm chủ đề</> : <><i className="fa-solid fa-pen-to-square"></i>Cập nhật chủ đề</>}</div>
            <div className="ap-page-subtitle">{isAdd ? 'Tạo chủ đề blog mới' : 'Chỉnh sửa thông tin chủ đề'}</div>
          </div>
          <Link to="/admin/list-subject" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>
      <div className="ap-card" style={{ maxWidth: 600 }}>
        <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-book" style={{marginRight: 8}}></i>Thông tin chủ đề</span></div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Tên chủ đề *</label>
              <input className="ap-input" name="value" value={values.value} onChange={handleChange} placeholder="VD: Thời trang, Sức khoẻ..." />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Mã code *</label>
              <input className="ap-input" name="code" value={values.code} onChange={handleChange} placeholder="VD: THOITRANG..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
            </button>
            <Link to="/admin/list-subject" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddSubject;
