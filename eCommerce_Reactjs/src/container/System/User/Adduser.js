import React, { useEffect, useState } from 'react';
import { createNewUser, getDetailUserById, UpdateUserService } from '../../../services/userService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import { useFetchAllcode } from '../../customize/fetch';
import moment from 'moment';

const Adduser = () => {
  const [birthday, setBirthday] = useState(new Date());
  const [isAdd, setIsAdd] = useState(true);
  const [isChangeDate, setIsChangeDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const { data: dataGender } = useFetchAllcode('GENDER');
  const { data: dataRole } = useFetchAllcode('ROLE');

  const [values, setValues] = useState({
    email: '', password: '', firstName: '', lastName: '',
    address: '', phonenumber: '', genderId: '', roleId: '', id: '', dob: '',
  });

  useEffect(() => {
    if (dataGender?.length > 0 && dataRole?.length > 0 && values.genderId === '') {
      setValues(v => ({ ...v, genderId: dataGender[0].code, roleId: dataRole[0].code }));
    }
  }, [dataGender, dataRole]);

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailUserById(id).then(res => {
        if (res?.errCode === 0) {
          const d = res.data;
          setValues({ email: d.email, password: '', firstName: d.firstName, lastName: d.lastName, address: d.address, phonenumber: d.phonenumber, genderId: d.genderId, roleId: d.roleId, id: d.id, dob: d.dob });
          setBirthday(moment.unix(+d.dob / 1000).toDate());
        }
      });
    }
  }, [id]);

  const handleChange = (e) => setValues(v => ({ ...v, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewUser({ email: values.email, password: values.password, firstName: values.firstName, lastName: values.lastName, address: values.address, roleId: values.roleId, genderId: values.genderId, phonenumber: values.phonenumber, dob: new Date(birthday).getTime() })
        : await UpdateUserService({ id: values.id, firstName: values.firstName, lastName: values.lastName, address: values.address, roleId: values.roleId, genderId: values.genderId, phonenumber: values.phonenumber, dob: isChangeDate ? new Date(birthday).getTime() : values.dob });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Thêm người dùng thành công' : 'Cập nhật thành công');
        if (isAdd) setValues({ email: '', password: '', firstName: '', lastName: '', address: '', phonenumber: '', genderId: dataGender?.[0]?.code || '', roleId: dataRole?.[0]?.code || '', id: '', dob: '' });
      } else toast.error(res?.errMessage || 'Thao tác thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">{isAdd ? '➕ Thêm người dùng' : '✏️ Cập nhật người dùng'}</div>
            <div className="ap-page-subtitle">{isAdd ? 'Tạo tài khoản người dùng mới' : `Chỉnh sửa thông tin người dùng`}</div>
          </div>
          <Link to="/admin/list-user" className="ap-btn ap-btn-ghost">← Quay lại</Link>
        </div>
      </div>

      <div className="ap-card" style={{ maxWidth: 760 }}>
        <div className="ap-card-header"><span className="ap-card-title">👤 Thông tin tài khoản</span></div>
        <div className="ap-card-body">
          {isAdd && (
            <div className="ap-form-row">
              <div className="ap-form-group">
                <label className="ap-label">Email *</label>
                <input className="ap-input" type="email" name="email" value={values.email} onChange={handleChange} placeholder="user@example.com" />
              </div>
              <div className="ap-form-group">
                <label className="ap-label">Mật khẩu *</label>
                <input className="ap-input" type="password" name="password" onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>
          )}
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Họ *</label>
              <input className="ap-input" name="firstName" value={values.firstName} onChange={handleChange} placeholder="Nguyễn" />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Tên *</label>
              <input className="ap-input" name="lastName" value={values.lastName} onChange={handleChange} placeholder="Văn A" />
            </div>
          </div>
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Số điện thoại</label>
              <input className="ap-input" name="phonenumber" value={values.phonenumber} onChange={handleChange} placeholder="0912 345 678" />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Ngày sinh</label>
              <div className="ap-datepicker-wrap" style={{ display: 'block' }}>
                <DatePicker
                  className="ap-input"
                  selected={birthday}
                  onChange={(d) => { setBirthday(d); setIsChangeDate(true); }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Chọn ngày sinh"
                />
              </div>
            </div>
          </div>
          <div className="ap-form-group">
            <label className="ap-label">Địa chỉ</label>
            <input className="ap-input" name="address" value={values.address} onChange={handleChange} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
          </div>
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Giới tính</label>
              <select className="ap-select" name="genderId" value={values.genderId} onChange={handleChange}>
                {dataGender?.map(g => <option key={g.code} value={g.code}>{g.value}</option>)}
              </select>
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Vai trò</label>
              <select className="ap-select" name="roleId" value={values.roleId} onChange={handleChange}>
                {dataRole?.map(r => <option key={r.code} value={r.code}>{r.value}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
            </button>
            <Link to="/admin/list-user" className="ap-btn ap-btn-ghost">Hủy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Adduser;
