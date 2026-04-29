import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getDetailAddressUserByIdService } from '../../services/userService';
import '../../css/user-pages.css';
import './AddressModal.css';

const AddressUsersModal = (props) => {
  const [inputValues, setInputValues] = useState({
    shipName: '',
    shipEmail: '',
    shipPhonenumber: '',
    houseNumber: '',
    isActionUpdate: false,
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [loadingGeo, setLoadingGeo] = useState(false);

  // ── Load provinces ─────────────────────────────────────────
  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await res.json();
      setProvinces(data);
    };
    fetchProvinces();
  }, []);

  // ── Load address detail khi edit ───────────────────────────
  useEffect(() => {
    const loadAddressDetail = async () => {
      if (props.addressUserId) {
        const res = await getDetailAddressUserByIdService(props.addressUserId);
        if (res?.errCode === 0) {
          const d = res.data;
          const parts = (d.shipAdress || '').split(',').map((s) => s.trim());
          const isFormFormat =
            parts.length >= 4 &&
            (parts[2].includes('Huyện') || parts[2].includes('Quận') || parts[2].includes('Thị xã'));

          if (isFormFormat) {
            const [houseNumber, wardName, districtName, provinceName] = parts;
            setInputValues({ shipName: d.shipName || '', shipEmail: d.shipEmail || '', shipPhonenumber: d.shipPhonenumber || '', houseNumber, isActionUpdate: true });
            const matchedProvince = provinces.find((p) => p.name === provinceName);
            if (matchedProvince) {
              setSelectedProvince(matchedProvince.code);
              const resP = await fetch(`https://provinces.open-api.vn/api/p/${matchedProvince.code}?depth=2`);
              const dataP = await resP.json();
              setDistricts(dataP.districts);
              const matchedDistrict = dataP.districts.find((dist) => dist.name === districtName);
              if (matchedDistrict) {
                setSelectedDistrict(matchedDistrict.code);
                const resD = await fetch(`https://provinces.open-api.vn/api/d/${matchedDistrict.code}?depth=2`);
                const dataD = await resD.json();
                setWards(dataD.wards);
                const matchedWard = dataD.wards.find((w) => w.name === wardName);
                if (matchedWard) setSelectedWard(matchedWard.code);
              }
            }
          } else {
            setInputValues({ shipName: d.shipName || '', shipEmail: d.shipEmail || '', shipPhonenumber: d.shipPhonenumber || '', houseNumber: d.shipAdress || '', isActionUpdate: true });
            setSelectedProvince(''); setSelectedDistrict(''); setSelectedWard('');
            setDistricts([]); setWards([]);
          }
        }
      } else {
        setInputValues({ shipName: '', shipEmail: '', shipPhonenumber: '', houseNumber: '', isActionUpdate: false });
        setSelectedProvince(''); setSelectedDistrict(''); setSelectedWard('');
        setDistricts([]); setWards([]);
      }
    };
    if (props.isOpenModal && provinces.length > 0) loadAddressDetail();
  }, [props.addressUserId, props.isOpenModal, provinces]);

  const handleProvinceChange = async (code) => {
    setSelectedProvince(code); setSelectedDistrict(''); setSelectedWard(''); setWards([]);
    if (!code) { setDistricts([]); return; }
    const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
    const data = await res.json();
    setDistricts(data.districts);
  };

  const handleDistrictChange = async (code) => {
    setSelectedDistrict(code); setSelectedWard('');
    if (!code) { setWards([]); return; }
    const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
    const data = await res.json();
    setWards(data.wards);
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveInfor = async () => {
    if (!inputValues.shipName.trim()) { toast.error('Vui lòng nhập họ tên'); return; }
    if (!inputValues.shipPhonenumber.trim()) { toast.error('Vui lòng nhập số điện thoại'); return; }
    if (!inputValues.houseNumber.trim()) { toast.error('Vui lòng nhập số nhà / tên đường'); return; }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh / Huyện / Phường'); return;
    }
    setLoadingGeo(true);
    try {
      const pRaw = provinces.find((p) => p.code == selectedProvince)?.name || '';
      const dRaw = districts.find((d) => d.code == selectedDistrict)?.name || '';
      const wRaw = wards.find((w) => w.code == selectedWard)?.name || '';
      const clean = (str) => str ? str.replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/gi, '').trim() : '';

      const queries = [
        `q=${encodeURIComponent(`${clean(wRaw)}, ${clean(dRaw)}, ${clean(pRaw)}, Vietnam`)}`,
        `q=${encodeURIComponent(`${wRaw}, ${dRaw}, ${pRaw}, Vietnam`)}`,
        `q=${encodeURIComponent(`${clean(dRaw)}, ${clean(pRaw)}, Vietnam`)}`,
      ];

      let finalData = null;
      for (const query of queries) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`, { headers: { 'User-Agent': 'MyGeoApp/1.0' } });
        const result = await res.json();
        if (result?.length > 0) { finalData = result[0]; break; }
      }

      if (finalData) {
        props.sendDataFromModalAddress({
          shipName: inputValues.shipName,
          shipAdress: `${inputValues.houseNumber}, ${wRaw}, ${dRaw}, ${pRaw}`,
          shipEmail: inputValues.shipEmail,
          shipPhonenumber: inputValues.shipPhonenumber,
          id: props.addressUserId,
          isActionUpdate: inputValues.isActionUpdate,
          lat: parseFloat(finalData.lat),
          lng: parseFloat(finalData.lon),
        });
        props.closeModaAddressUser();
      } else {
        toast.error('Không tìm thấy tọa độ. Hãy thử nhập địa chỉ đơn giản hơn.');
      }
    } catch {
      toast.error('Lỗi kết nối máy chủ bản đồ.');
    } finally {
      setLoadingGeo(false);
    }
  };

  if (!props.isOpenModal) return null;

  const isEdit = !!props.addressUserId;

  return (
    <div className="addr-modal-overlay" onClick={(e) => e.target === e.currentTarget && props.closeModaAddressUser()}>
      <div className="addr-modal">
        {/* Header */}
        <div className="addr-modal__header">
          <div className="addr-modal__header-left">
            <div className="addr-modal__icon">
              <i className="fa-solid fa-location-dot" />
            </div>
            <div>
              <h3 className="addr-modal__title">
                {isEdit ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
              </h3>
              <p className="addr-modal__subtitle">
                {isEdit ? 'Chỉnh sửa thông tin địa chỉ giao hàng' : 'Điền đầy đủ thông tin để thêm địa chỉ mới'}
              </p>
            </div>
          </div>
          <button className="addr-modal__close" onClick={props.closeModaAddressUser}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="addr-modal__body">
          {/* Thông tin liên lạc */}
          <div className="addr-modal__section-label">
            <i className="fa-solid fa-user" />
            Thông tin liên lạc
          </div>

          <div className="addr-modal__row">
            <div className="addr-modal__field">
              <label>Họ và tên <span className="addr-required">*</span></label>
              <input
                name="shipName"
                className="addr-input"
                placeholder="Nhập họ và tên"
                value={inputValues.shipName}
                onChange={handleOnChange}
              />
            </div>
            <div className="addr-modal__field">
              <label>Số điện thoại <span className="addr-required">*</span></label>
              <input
                name="shipPhonenumber"
                className="addr-input"
                placeholder="0xxx xxx xxx"
                value={inputValues.shipPhonenumber}
                onChange={handleOnChange}
              />
            </div>
          </div>

          <div className="addr-modal__field">
            <label>Email</label>
            <input
              name="shipEmail"
              className="addr-input"
              placeholder="email@example.com"
              value={inputValues.shipEmail}
              onChange={handleOnChange}
            />
          </div>

          {/* Địa chỉ */}
          <div className="addr-modal__section-label" style={{ marginTop: 20 }}>
            <i className="fa-solid fa-map-pin" />
            Địa chỉ giao hàng
          </div>

          <div className="addr-modal__field">
            <label>Số nhà / Tên đường <span className="addr-required">*</span></label>
            <input
              name="houseNumber"
              className="addr-input"
              placeholder="VD: 123 Nguyễn Văn A"
              value={inputValues.houseNumber}
              onChange={handleOnChange}
            />
          </div>

          <div className="addr-modal__row addr-modal__row--3">
            <div className="addr-modal__field">
              <label>Tỉnh / Thành phố <span className="addr-required">*</span></label>
              <div className="addr-select-wrap">
                <select
                  className="addr-input addr-select"
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                >
                  <option value="">Chọn tỉnh/TP</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down addr-select-arrow" />
              </div>
            </div>
            <div className="addr-modal__field">
              <label>Quận / Huyện <span className="addr-required">*</span></label>
              <div className="addr-select-wrap">
                <select
                  className="addr-input addr-select"
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedProvince}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down addr-select-arrow" />
              </div>
            </div>
            <div className="addr-modal__field">
              <label>Phường / Xã <span className="addr-required">*</span></label>
              <div className="addr-select-wrap">
                <select
                  className="addr-input addr-select"
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  disabled={!selectedDistrict}
                >
                  <option value="">Chọn phường/xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down addr-select-arrow" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="addr-modal__footer">
          <button className="addr-btn-cancel" onClick={props.closeModaAddressUser}>
            Hủy
          </button>
          <button
            className="addr-btn-save"
            onClick={handleSaveInfor}
            disabled={loadingGeo}
          >
            {loadingGeo
              ? <><i className="fa-solid fa-spinner fa-spin" /> Đang xử lý...</>
              : <><i className="fa-solid fa-floppy-disk" /> {isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressUsersModal;
