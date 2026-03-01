import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalFooter, Button } from 'reactstrap';
import { toast } from 'react-toastify';
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

      // 1. Lấy tên gốc từ API Provinces
      const pRaw = provinces.find((p) => p.code == selectedProvince)?.name || '';
      const dRaw = districts.find((d) => d.code == selectedDistrict)?.name || '';
      const wRaw = wards.find((w) => w.code == selectedWard)?.name || '';

      // 2. Hàm làm sạch chuỗi: Loại bỏ "Thành phố", "Tỉnh", "Quận", "Huyện", "Phường", "Xã"
      // Điều này giúp Nominatim tìm theo từ khóa gốc (ví dụ: "Đông Anh" thay vì "Huyện Đông Anh")
      const clean = (str) => {
        if (!str) return '';
        return str
          .replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/gi, '')
          .trim();
      };

      const cleanW = clean(wRaw);
      const cleanD = clean(dRaw);
      const cleanP = clean(pRaw);

      // 3. Tạo các phương án tìm kiếm (từ chi tiết đến tổng quát)
      // Ưu tiên 1: Cấu trúc chính xác (Structured)
      // Ưu tiên 2: Chuỗi làm sạch (Ward, District, Province)
      // Ưu tiên 3: Chỉ District, Province (Tọa độ trung tâm huyện)

      const searchOptions = [
        // Option 1: Chuỗi làm sạch (Tỉ lệ thành công cao nhất ở VN)
        `q=${encodeURIComponent(`${cleanW}, ${cleanD}, ${cleanP}, Vietnam`)}`,
        // Option 2: Chuỗi gốc đầy đủ
        `q=${encodeURIComponent(`${wRaw}, ${dRaw}, ${pRaw}, Vietnam`)}`,
        // Option 3: Chỉ tìm đến cấp Quận/Huyện nếu Phường quá nhỏ không có trên map
        `q=${encodeURIComponent(`${cleanD}, ${cleanP}, Vietnam`)}`,
      ];

      let finalData = null;

      for (const query of searchOptions) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${query}&format=json&limit=1`,
          {
            headers: { 'User-Agent': 'MyGeoApp/1.0' },
          }
        );
        const result = await res.json();
        if (result && result.length > 0) {
          finalData = result[0];
          break; // Dừng lại khi tìm thấy kết quả đầu tiên hợp lệ
        }
      }

      if (finalData) {
        const lat = parseFloat(finalData.lat);
        const lng = parseFloat(finalData.lon);

        props.sendDataFromModalAddress({
          shipName: inputValues.shipName,
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
        <h5>Thêm địa chỉ mới</h5>
        <button onClick={props.closeModaAddressUser}>X</button>
      </div>

      <ModalBody>
        <div className="row">
          <div className="col-6 mb-3">
            <label>Họ tên</label>
            <input
              name="shipName"
              className="form-control"
              value={inputValues.shipName}
              onChange={handleOnChange}
            />
          </div>

          <div className="col-6 mb-3">
            <label>SĐT</label>
            <input
              name="shipPhonenumber"
              className="form-control"
              value={inputValues.shipPhonenumber}
              onChange={handleOnChange}
            />
          </div>

          <div className="col-12 mb-3">
            <label>Email</label>
            <input
              name="shipEmail"
              className="form-control"
              value={inputValues.shipEmail}
              onChange={handleOnChange}
            />
          </div>

          <div className="col-12 mb-3">
            <label>Số nhà</label>
            <input
              name="houseNumber"
              className="form-control"
              value={inputValues.houseNumber}
              onChange={handleOnChange}
            />
          </div>

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
