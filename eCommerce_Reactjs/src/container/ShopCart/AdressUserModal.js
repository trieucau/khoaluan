import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalFooter, Button } from 'reactstrap';
import { toast } from 'react-toastify';
import { getDetailAddressUserByIdService } from '../../services/userService';

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

  // ================= LOAD PROVINCES =================
  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await res.json();
      setProvinces(data);
    };
    fetchProvinces();
  }, []);

  // ================= LOAD ADDRESS DETAIL KHI EDIT =================
  useEffect(() => {
    const loadAddressDetail = async () => {
      if (props.addressUserId) {
        // ---- MODE SỬA: load dữ liệu cũ ----
        const res = await getDetailAddressUserByIdService(props.addressUserId);
        if (res && res.errCode === 0) {
          const d = res.data;

          const parts = (d.shipAdress || '').split(',').map((s) => s.trim());

          // Phân biệt địa chỉ từ form thủ công hay từ bản đồ
          const isFormFormat =
            parts.length >= 4 &&
            (parts[2].includes('Huyện') ||
              parts[2].includes('Quận') ||
              parts[2].includes('Thị xã'));

          if (isFormFormat) {
            // ---- Địa chỉ từ form thủ công → tách đúng 4 phần ----
            const houseNumber = parts[0] || '';
            const wardName = parts[1] || '';
            const districtName = parts[2] || '';
            const provinceName = parts[3] || '';

            setInputValues({
              shipName: d.shipName || '',
              shipEmail: d.shipEmail || '',
              shipPhonenumber: d.shipPhonenumber || '',
              houseNumber: houseNumber,
              isActionUpdate: true,
            });

            const matchedProvince = provinces.find((p) => p.name === provinceName);
            if (matchedProvince) {
              setSelectedProvince(matchedProvince.code);

              const resP = await fetch(
                `https://provinces.open-api.vn/api/p/${matchedProvince.code}?depth=2`
              );
              const dataP = await resP.json();
              setDistricts(dataP.districts);

              const matchedDistrict = dataP.districts.find((dist) => dist.name === districtName);
              if (matchedDistrict) {
                setSelectedDistrict(matchedDistrict.code);

                const resD = await fetch(
                  `https://provinces.open-api.vn/api/d/${matchedDistrict.code}?depth=2`
                );
                const dataD = await resD.json();
                setWards(dataD.wards);

                const matchedWard = dataD.wards.find((w) => w.name === wardName);
                if (matchedWard) setSelectedWard(matchedWard.code);
              }
            }
          } else {
            // ---- Địa chỉ từ bản đồ → đổ toàn bộ vào houseNumber, reset dropdown ----
            setInputValues({
              shipName: d.shipName || '',
              shipEmail: d.shipEmail || '',
              shipPhonenumber: d.shipPhonenumber || '',
              houseNumber: d.shipAdress || '',
              isActionUpdate: true,
            });
            setSelectedProvince('');
            setSelectedDistrict('');
            setSelectedWard('');
            setDistricts([]);
            setWards([]);
          }
        }
      } else {
        // ---- MODE THÊM MỚI: reset toàn bộ form ----
        setInputValues({
          shipName: '',
          shipEmail: '',
          shipPhonenumber: '',
          houseNumber: '',
          isActionUpdate: false,
        });
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedWard('');
        setDistricts([]);
        setWards([]);
      }
    };

    // Chỉ chạy khi modal đang mở VÀ danh sách tỉnh đã được load xong
    if (props.isOpenModal && provinces.length > 0) {
      loadAddressDetail();
    }
  }, [props.addressUserId, props.isOpenModal, provinces]);

  // ================= LOAD DISTRICTS =================
  const handleProvinceChange = async (code) => {
    setSelectedProvince(code);
    setSelectedDistrict('');
    setSelectedWard('');
    setWards([]);

    const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
    const data = await res.json();
    setDistricts(data.districts);
  };

  // ================= LOAD WARDS =================
  const handleDistrictChange = async (code) => {
    setSelectedDistrict(code);
    setSelectedWard('');

    const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
    const data = await res.json();
    setWards(data.wards);
  };

  // ================= HANDLE INPUT =================
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= SAVE =================
  const handleSaveInfor = async () => {
    try {
      if (!inputValues.houseNumber) {
        alert('Vui lòng nhập số nhà');
        return;
      }
      if (!selectedProvince || !selectedDistrict || !selectedWard) {
        alert('Vui lòng chọn đầy đủ Tỉnh / Huyện / Phường');
        return;
      }

      setLoadingGeo(true);

      // Lấy tên gốc từ state
      const pRaw = provinces.find((p) => p.code == selectedProvince)?.name || '';
      const dRaw = districts.find((d) => d.code == selectedDistrict)?.name || '';
      const wRaw = wards.find((w) => w.code == selectedWard)?.name || '';

      // Hàm làm sạch chuỗi để geocoding
      const clean = (str) => {
        if (!str) return '';
        return str
          .replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/gi, '')
          .trim();
      };

      const cleanW = clean(wRaw);
      const cleanD = clean(dRaw);
      const cleanP = clean(pRaw);

      const searchOptions = [
        `q=${encodeURIComponent(`${cleanW}, ${cleanD}, ${cleanP}, Vietnam`)}`,
        `q=${encodeURIComponent(`${wRaw}, ${dRaw}, ${pRaw}, Vietnam`)}`,
        `q=${encodeURIComponent(`${cleanD}, ${cleanP}, Vietnam`)}`,
      ];

      let finalData = null;

      for (const query of searchOptions) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`,
          { headers: { 'User-Agent': 'MyGeoApp/1.0' } }
        );
        const result = await res.json();
        if (result && result.length > 0) {
          finalData = result[0];
          break;
        }
      }

      if (finalData) {
        const lat = parseFloat(finalData.lat);
        const lng = parseFloat(finalData.lon);

        props.sendDataFromModalAddress({
          shipName: inputValues.shipName,
          // Lưu đúng format: "số nhà, phường, huyện, tỉnh"
          shipAdress: `${inputValues.houseNumber}, ${wRaw}, ${dRaw}, ${pRaw}`,
          shipEmail: inputValues.shipEmail,
          shipPhonenumber: inputValues.shipPhonenumber,
          id: props.addressUserId,
          isActionUpdate: inputValues.isActionUpdate,
          lat: lat,
          lng: lng,
        });

        props.closeModaAddressUser();
      } else {
        toast.error(
          'Không tìm thấy tọa độ. Hãy thử nhập số nhà đơn giản hơn hoặc chọn lại địa chỉ.'
        );
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Lỗi kết nối máy chủ bản đồ.');
    } finally {
      setLoadingGeo(false);
    }
  };

  return (
    <Modal isOpen={props.isOpenModal} centered size="lg">
      <div className="modal-header">
        <h5>{props.addressUserId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h5>
        <button onClick={props.closeModaAddressUser}>X</button>
      </div>

      <ModalBody>
        <div className="row">
          {/* Họ tên */}
          <div className="col-6 mb-3">
            <label>Họ tên</label>
            <input
              name="shipName"
              className="form-control"
              value={inputValues.shipName}
              onChange={handleOnChange}
            />
          </div>

          {/* SĐT */}
          <div className="col-6 mb-3">
            <label>SĐT</label>
            <input
              name="shipPhonenumber"
              className="form-control"
              value={inputValues.shipPhonenumber}
              onChange={handleOnChange}
            />
          </div>

          {/* Email */}
          <div className="col-12 mb-3">
            <label>Email</label>
            <input
              name="shipEmail"
              className="form-control"
              value={inputValues.shipEmail}
              onChange={handleOnChange}
            />
          </div>

          {/* Số nhà — CHỈ nhập số nhà / tên đường, KHÔNG bao gồm phường/huyện/tỉnh */}
          <div className="col-12 mb-3">
            <label>Số nhà / Tên đường</label>
            <input
              name="houseNumber"
              className="form-control"
              placeholder="VD: 123 Nguyễn Văn A"
              value={inputValues.houseNumber}
              onChange={handleOnChange}
            />
          </div>

          {/* Tỉnh/TP */}
          <div className="col-4 mb-3">
            <label>Tỉnh/TP</label>
            <select
              className="form-control"
              value={selectedProvince}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              <option value="">Chọn tỉnh</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quận/Huyện */}
          <div className="col-4 mb-3">
            <label>Quận/Huyện</label>
            <select
              className="form-control"
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              <option value="">Chọn huyện</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phường/Xã */}
          <div className="col-4 mb-3">
            <label>Phường/Xã</label>
            <select
              className="form-control"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              <option value="">Chọn phường</option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button color="primary" onClick={handleSaveInfor} disabled={loadingGeo}>
          {loadingGeo ? 'Đang lấy tọa độ...' : 'Lưu thông tin'}
        </Button>
        <Button onClick={props.closeModaAddressUser}>Hủy</Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddressUsersModal;
