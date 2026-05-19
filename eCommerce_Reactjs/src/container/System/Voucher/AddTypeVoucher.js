import React, { useEffect, useState } from 'react';
import {
  createNewTypeVoucherService,
  getDetailTypeVoucherByIdService,
  updateTypeVoucherService,
} from '../../../services/userService';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import { useFetchAllcode } from '../../customize/fetch';
import CommonUtils from '../../../utils/CommonUtils';

const AddTypeVoucher = () => {
  const { data: dataTypeVoucher } = useFetchAllcode('DISCOUNT');
  const [isAdd, setIsAdd] = useState(true);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const [values, setValues] = useState({ typeVoucher: '', value: '', maxValue: '', minValue: '' });

  useEffect(() => {
    if (dataTypeVoucher?.length > 0 && !values.typeVoucher) {
      setValues((v) => ({ ...v, typeVoucher: dataTypeVoucher[0].code }));
    }
  }, [dataTypeVoucher]);

  useEffect(() => {
    if (id) {
      setIsAdd(false);
      getDetailTypeVoucherByIdService(id).then((res) => {
        if (res?.errCode === 0)
          setValues({
            typeVoucher: res.data.typeVoucher,
            value: res.data.value,
            maxValue: res.data.maxValue,
            minValue: res.data.minValue,
          });
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!values.value || !values.minValue || !values.maxValue) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const res = isAdd
        ? await createNewTypeVoucherService({
            typeVoucher: values.typeVoucher,
            value: values.value,
            maxValue: values.maxValue,
            minValue: values.minValue,
          })
        : await updateTypeVoucherService({
            typeVoucher: values.typeVoucher,
            value: values.value,
            maxValue: values.maxValue,
            minValue: values.minValue,
            id,
          });
      if (res?.errCode === 0) {
        toast.success(isAdd ? 'Thêm loại voucher thành công' : 'Cập nhật thành công');
        if (isAdd)
          setValues({
            typeVoucher: dataTypeVoucher?.[0]?.code || '',
            value: '',
            maxValue: '',
            minValue: '',
          });
      } else if (res?.errCode === 2) toast.error(res.errMessage);
      else toast.error('Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  const isPercent = values.typeVoucher === 'percent';

  return (
    <div className="ap-page">
      <div className="ap-page-header">
        <div className="ap-page-header-row">
          <div>
            <div className="ap-page-title">
              {isAdd ? (
                <>
                  <i className="fa-solid fa-ticket" style={{ marginRight: 8 }}></i>Thêm loại khuyến
                  mãi
                </>
              ) : (
                <>
                  <i className="fa-solid fa-pen-to-square"></i>Cập nhật loại KM
                </>
              )}
            </div>
            <div className="ap-page-subtitle">Cấu hình loại giảm giá và điều kiện áp dụng</div>
          </div>
          <Link to="/admin/list-typevoucher" className="ap-btn ap-btn-ghost">
            ← Quay lại
          </Link>
        </div>
      </div>

      <div className="ap-card" style={{ maxWidth: 680 }}>
        <div className="ap-card-header">
          <span className="ap-card-title">
            <i className="fa-solid fa-ticket" style={{ marginRight: 8 }}></i>Thông tin loại khuyến
            mãi
          </span>
        </div>
        <div className="ap-card-body">
          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Hình thức giảm giá *</label>
              <select
                className="ap-select"
                value={values.typeVoucher}
                onChange={(e) => setValues((v) => ({ ...v, typeVoucher: e.target.value }))}
              >
                {dataTypeVoucher?.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Giá trị giảm * {isPercent ? '(%)' : '(VNĐ)'}</label>
              <input
                className="ap-input"
                type="number"
                min="0"
                value={values.value}
                onChange={(e) => setValues((v) => ({ ...v, value: e.target.value }))}
                placeholder={isPercent ? 'VD: 20 (= 20%)' : 'VD: 50000'}
              />
              {values.value && isPercent && (
                <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 4 }}>
                  Giảm {values.value}% trên tổng đơn hàng
                </div>
              )}
            </div>
          </div>

          <div className="ap-form-row">
            <div className="ap-form-group">
              <label className="ap-label">Đơn hàng tối thiểu (VNĐ) *</label>
              <input
                className="ap-input"
                type="number"
                min="0"
                value={values.minValue}
                onChange={(e) => setValues((v) => ({ ...v, minValue: e.target.value }))}
                placeholder="VD: 200000"
              />
              {values.minValue && (
                <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>
                  ≥{' '}
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    values.minValue
                  )}
                </div>
              )}
            </div>
            <div className="ap-form-group">
              <label className="ap-label">Giảm tối đa (VNĐ) *</label>
              <input
                className="ap-input"
                type="number"
                min="0"
                value={values.maxValue}
                onChange={(e) => setValues((v) => ({ ...v, maxValue: e.target.value }))}
                placeholder="VD: 100000"
              />
              {values.maxValue && (
                <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>
                  ≤{' '}
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    values.maxValue
                  )}
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
            <Link to="/admin/list-typevoucher" className="ap-btn ap-btn-ghost">
              Hủy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AddTypeVoucher;
