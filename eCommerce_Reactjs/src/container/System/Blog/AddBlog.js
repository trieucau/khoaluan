import React, { useEffect, useState } from 'react';
import { createNewBlogrService, getDetailBlogByIdService, updateBlogService } from '../../../services/userService';
import CommonUtils from '../../../utils/CommonUtils';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import { useFetchAllcode } from '../../customize/fetch';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

const AddBlog = () => {
  const { id } = useParams();
  const { data: dataSubject } = useFetchAllcode('SUBJECT');
  const [loading, setLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [values, setValues] = useState({
    title: '', shortdescription: '', image: '', imageReview: '',
    contentMarkdown: '', contentHTML: '', subjectId: '',
  });

  useEffect(() => {
    if (dataSubject?.length > 0 && !values.subjectId) {
      setValues(v => ({ ...v, subjectId: dataSubject[0].code }));
    }
  }, [dataSubject]);

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailBlogByIdService(id).then(res => {
        if (res?.errCode === 0) {
          const d = res.data;
          setValues({ title: d.title, shortdescription: d.shortdescription, image: d.image, imageReview: d.image, contentMarkdown: d.contentMarkdown, contentHTML: d.contentHTML, subjectId: d.subjectId });
        }
      });
    }
  }, [id]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 31312281) { toast.error('Dung lượng file phải nhỏ hơn 30MB'); return; }
    const base64 = await CommonUtils.getBase64(file);
    const objectUrl = URL.createObjectURL(file);
    setValues(v => ({ ...v, image: base64, imageReview: objectUrl }));
  };

  const handleSave = async () => {
    if (!values.title) { toast.error('Vui lòng nhập tiêu đề bài đăng'); return; }
    setLoading(true);
    try {
      const userId = JSON.parse(localStorage.getItem('userData') || '{}').id;
      const res = isAdd
        ? await createNewBlogrService({ shortdescription: values.shortdescription, title: values.title, subjectId: values.subjectId, image: values.image, contentMarkdown: values.contentMarkdown, contentHTML: values.contentHTML, userId })
        : await updateBlogService({ shortdescription: values.shortdescription, title: values.title, subjectId: values.subjectId, image: values.image, contentMarkdown: values.contentMarkdown, contentHTML: values.contentHTML, id });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Tạo bài đăng thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ title: '', shortdescription: '', image: '', imageReview: '', contentMarkdown: '', contentHTML: '', subjectId: dataSubject?.[0]?.code || '' });
      } else toast.error('Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? <><i className="fa-solid fa-pen-nib" style={{marginRight: 8}}></i>Tạo bài đăng</> : <><i className="fa-solid fa-pen-to-square"></i>Chỉnh sửa bài đăng</>}</div>
            <div className="ap-page-subtitle">{isAdd ? 'Viết bài blog mới' : 'Cập nhật nội dung bài viết'}</div>
          </div>
          <Link to="/admin/list-blog" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>

      <div className="ap-card">
        <div className="ap-card-header"><span className="ap-card-title"><i className="fa-solid fa-pen-to-square" style={{marginRight: 8}}></i>Thông tin bài viết</span></div>
        <div className="ap-card-body">
          {/* Basic info row */}
          <div className="ap-form-row">
            <div className="ap-form-group" style={{ flex: 2 }}>
              <label className="ap-label">Tiêu đề bài viết *</label>
              <input className="ap-input" value={values.title} onChange={e => setValues(v => ({ ...v, title: e.target.value }))} placeholder="Nhập tiêu đề hấp dẫn..." />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Chủ đề</label>
              <select className="ap-select" value={values.subjectId} onChange={e => setValues(v => ({ ...v, subjectId: e.target.value }))}>
                {dataSubject?.map(s => <option key={s.code} value={s.code}>{s.value}</option>)}
              </select>
            </div>
          </div>

          {/* Image upload */}
          <div className="ap-form-row" style={{ alignItems: 'flex-start' }}>
            <div className="ap-form-group" style={{ flex: 2 }}>
              <label className="ap-label">Hình ảnh đại diện</label>
              <input className="ap-input" type="file" accept=".jpg,.png,.webp" onChange={handleImageChange}
                style={{ padding: '8px 12px', cursor: 'pointer' }} />
              <div style={{ fontSize: 12, color: 'var(--ap-text-dim)', marginTop: 4 }}>JPG, PNG, WEBP · tối đa 30MB</div>
            </div>
            {values.imageReview && (
              <div className="ap-form-group">
                <label className="ap-label">Preview</label>
                <img src={values.imageReview} alt="preview" onClick={() => setLightboxOpen(true)}
                  style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 'var(--ap-radius-sm)', cursor: 'zoom-in', border: '1px solid var(--ap-border)' }} />
              </div>
            )}
          </div>

          {/* Short description */}
          <div className="ap-form-group">
            <label className="ap-label">Mô tả ngắn</label>
            <textarea className="ap-input" rows={3} value={values.shortdescription}
              onChange={e => setValues(v => ({ ...v, shortdescription: e.target.value }))}
              placeholder="Tóm tắt nội dung bài viết (hiển thị trên danh sách)..."
              style={{ resize: 'vertical' }} />
          </div>

          {/* Markdown editor */}
          <div className="ap-form-group">
            <label className="ap-label">Nội dung bài đăng (Markdown)</label>
            <div style={{ borderRadius: 'var(--ap-radius-sm)', overflow: 'hidden', border: '1px solid var(--ap-border)' }}>
              <MdEditor style={{ height: 500 }} renderHTML={text => mdParser.render(text)}
                onChange={({ html, text }) => setValues(v => ({ ...v, contentMarkdown: text, contentHTML: html }))}
                value={values.contentMarkdown} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang lưu...' : (isAdd ? '🚀 Đăng bài' : '💾 Lưu thay đổi')}
            </button>
            <Link to="/admin/list-blog" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>

      {lightboxOpen && <Lightbox slides={[{ src: values.imageReview }]} open={lightboxOpen} close={() => setLightboxOpen(false)} />}
    </div>
  );
};
export default AddBlog;
