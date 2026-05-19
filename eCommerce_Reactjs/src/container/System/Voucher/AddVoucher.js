import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import {
  getSelectTypeVoucher,
  createNewVoucherService,
  getDetailVoucherByIdService,
  updateVoucherService,
} from '../../../services/userService';
import moment from 'moment';

const AddVoucher = () => {
  const [typeVouchers, setTypeVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const { id } = useParams();
  const [values, setValues] = useState({
    fromDate: new Date(),
    toDate: new Date(),
    typeVoucherId: '',
    amount: '',
    codeVoucher: '',
    isChangeFromDate: false,
    isChangeToDate: false,
    fromDateUpdate: '',
    toDateUpdate: '',
  });

  useEffect(() => {
    getSelectTypeVoucher().then((res) => {
      if (res?.errCode === 0) {
        setTypeVouchers(res.data);
        if (!id) setValues((v) => ({ ...v, typeVoucherId: res.data[0]?.id || '' }));
      }
    });
    if (id) {
      setIsAdd(false);
      getDetailVoucherByIdService(id).then((res) => {
        if (res?.errCode === 0) {
          const d = res.data;
          setValues((v) => ({
            ...v,
            fromDate: moment.unix(+d.fromDate / 1000).toDate(),
            toDate: moment.unix(+d.toDate / 1000).toDate(),
            typeVoucherId: d.typeVoucherId,
            amount: d.amount,
            codeVoucher: d.codeVoucher,
            fromDateUpdate: d.fromDate,
            toDateUpdate: d.toDate,
          }));
        }
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!values.codeVoucher || !values.amount) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewVoucherService({
            fromDate: new Date(values.fromDate).getTime(),
            toDate: new Date(values.toDate).getTime(),
            typeVoucherId: values.typeVoucherId,
            amount: values.amount,
            codeVoucher: values.codeVoucher,
          })
        : await updateVoucherService({
            id,
            typeVoucherId: values.typeVoucherId,
            amount: values.amount,
            codeVoucher: values.codeVoucher,
            fromDate: values.isChangeFromDate
              ? new Date(values.fromDate).getTime()
              : values.fromDateUpdate,
            toDate: values.isChangeToDate ? new Date(values.toDate).getTime() : values.toDateUpdate,
          });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Tạo voucher thành công' : 'Cập nhật thành công');
        if (isAdd)
          setValues((v) => ({
            ...v,
            codeVoucher: '',
            amount: '',
            fromDate: new Date(),
            toDate: new Date(),
          }));
      } else toast.error(res?.errMessage || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = values.toDate && moment(values.toDate).isBefore(moment());

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              {isAdd ? (
                <>
                  <i className="fa-solid fa-tags" style={{ marginRight: 8 }}></i>Tạo mã Voucher
                </>
              ) : (
                <>
                  <i className="fa-solid fa-pen-to-square"></i>Cập nhật Voucher
                </>
              )}
            </div>
            <div className="ap-page-subtitle">Cấu hình mã giảm giá cho khách hàng</div>
          </div>
          <Link to="/admin/list-voucher" className="ap-btn ap-btn-ghost">
            ← Quay lại
          </Link>
        </div>
      </div>

      <div className="ap-card" style={{ maxWidth: 720 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">
            <i className="fa-solid fa-tags" style={{ marginRight: 8 }}></i>Thông tin voucher
          </span>
        </div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Mã Voucher *</label>
              <input
                className="ap-input"
                value={values.codeVoucher}
                onChange={(e) => setValues((v) => ({ ...v, codeVoucher: e.target.value }))}
                placeholder="VD: SUMMER2025"
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 2 }}
              />
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Số lượng mã *</label>
              <input
                className="ap-input"
                type="number"
                min="1"
                value={values.amount}
                onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
                placeholder="VD: 100"
              />
            </div>
          </div>

          <div className="ap-form-group">
            <label className="ap-label">Loại khuyến mãi *</label>
            <select
              className="ap-select"
              value={values.typeVoucherId}
              onChange={(e) => setValues((v) => ({ ...v, typeVoucherId: e.target.value }))}
            >
              {typeVouchers.map((tv) => (
                <option key={tv.id} value={tv.id}>
                  {tv.value} {tv.typeVoucherData?.value}
                </option>
              ))}
            </select>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Ngày bắt đầu *</label>
              <div className="ap-datepicker-wrap" style={{ display: 'block' }}>
                <DatePicker
                  className="ap-input"
                  selected={values.fromDate}
                  dateFormat="dd/MM/yyyy"
                  onChange={(d) =>
                    setValues((v) => ({ ...v, fromDate: d, isChangeFromDate: true }))
                  }
                />
              </div>
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Ngày kết thúc *</label>
              <div className="ap-datepicker-wrap" style={{ display: 'block' }}>
                <DatePicker
                  className="ap-input"
                  selected={values.toDate}
                  dateFormat="dd/MM/yyyy"
                  onChange={(d) => setValues((v) => ({ ...v, toDate: d, isChangeToDate: true }))}
                  minDate={values.fromDate}
                />
              </div>
              {isExpired && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{' '}
                  Ngày kết thúc đã qua
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-hourglass-half" style={{ marginRight: 8 }}></i> Đang
                  lưu...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }}></i> Lưu thông
                  tin
                </>
              )}
            </button>
            <Link to="/admin/list-voucher" className="ap-btn ap-btn-ghost">
              Hủy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddVoucher;
