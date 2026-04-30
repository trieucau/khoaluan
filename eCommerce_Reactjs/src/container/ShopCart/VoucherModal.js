import React from 'react';
import { useEffect, useState } from 'react';

import moment from 'moment';
import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { ChooseVoucherStart } from '../../action/ShopCartAction';

import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import '../User/StoreVoucher.scss';
import { getAllVoucherByUserIdService } from '../../services/userService';
import CommonUtils from '../../utils/CommonUtils';
import VoucherItemSmall from '../User/VoucherItemSmall';

const VoucherModal = (props) => {
  const dispatch = useDispatch();
  const [inputValues, setInputValues] = useState({
    codeVoucher: '',
    activeBtn: false,
  });
  const [dataVoucher, setdataVoucher] = useState([]);
  
  let handleCloseModal = () => {
    props.closeModal();
  };
  
  function compareDates(date1, date2) {
    const [day1, month1, year1] = date1.split('/');
    const [day2, month2, year2] = date2.split('/');

    const d1 = new Date(year1, month1 - 1, day1);
    const d2 = new Date(year2, month2 - 1, day2);

    return d1 <= d2;
  }
  
  useEffect(() => {
    let id = props.id;
    if (id) {
      let fetchData = async () => {
        let arrData = await getAllVoucherByUserIdService({
          limit: '',
          offset: '',
          id: props.id,
        });
        let arrTemp = [];
        if (arrData && arrData.errCode === 0) {
          let nowDate = moment.unix(Date.now() / 1000).format('DD/MM/YYYY');

          for (let i = 0; i < arrData.data.length; i++) {
            let fromDate = moment
              .unix(arrData.data[i].voucherData.fromDate / 1000)
              .format('DD/MM/YYYY');
            let toDate = moment
              .unix(arrData.data[i].voucherData.toDate / 1000)
              .format('DD/MM/YYYY');
            let amount = arrData.data[i].voucherData.amount;
            let usedAmount = arrData.data[i].voucherData.usedAmount;
            let minValue = arrData.data[i].voucherData.typeVoucherOfVoucherData.minValue;

            if (
              amount > usedAmount &&
              compareDates(toDate, nowDate) === false &&
              compareDates(fromDate, nowDate) === true &&
              minValue <= props.price
            ) {
              arrTemp[i] = arrData.data[i];
            }
          }
          setdataVoucher(arrTemp);
        }
      };
      fetchData();
    }
  }, [props.isOpenModal, props.id, props.price]);

  const handleOnChange = (event) => {
    const { name, value } = event.target;

    if (value !== '') {
      setInputValues({ ...inputValues, ['activeBtn']: true, [name]: value });
    } else {
      setInputValues({ ...inputValues, ['activeBtn']: false, [name]: value });
    }
  };

  const handleApplyVoucherCode = () => {
    if (!inputValues.codeVoucher) {
      toast.error('Vui lòng nhập mã voucher!');
      return;
    }
    
    // Tìm voucher trong danh sách hợp lệ
    let foundVoucher = dataVoucher.find(
      (item) => item.voucherData.codeVoucher.toLowerCase() === inputValues.codeVoucher.toLowerCase()
    );

    if (foundVoucher) {
      dispatch(ChooseVoucherStart(foundVoucher));
      toast.success('Áp dụng mã thành công!');
      props.closeModalFromVoucherItem();
      setInputValues({ codeVoucher: '', activeBtn: false });
    } else {
      toast.error('Mã voucher không hợp lệ, không đủ điều kiện hoặc đã hết hạn!');
    }
  };

  let closeModalFromVoucherItem = () => {
    props.closeModalFromVoucherItem();
  };

  return (
    <div className="">
      <Modal isOpen={props.isOpenModal} className={'booking-modal-container voucher-modal'} size="md" centered>
        <div className="modal-header border-bottom-0 pb-0">
          <h5 className="modal-title font-weight-bold" style={{fontSize: '1.25rem'}}>Chọn Eiser Voucher</h5>
          <button
            onClick={handleCloseModal}
            type="button"
            className="btn btn-time close-btn"
            aria-label="Close"
            style={{background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', color: '#888'}}
          >
            &times;
          </button>
        </div>
        <ModalBody className="pt-2">
          {/* Ô nhập mã Voucher */}
          <div className="voucher-input-group mb-4" style={{ display: 'flex', gap: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Nhập mã voucher tại đây..."
              name="codeVoucher"
              value={inputValues.codeVoucher}
              onChange={handleOnChange}
              style={{ flex: 1, border: '1px solid #ced4da', borderRadius: '4px', padding: '10px 15px' }}
            />
            <button
              className={`btn ${inputValues.activeBtn ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleApplyVoucherCode}
              disabled={!inputValues.activeBtn}
              style={{
                backgroundColor: inputValues.activeBtn ? '#ee4d2d' : '#e0e0e0',
                borderColor: inputValues.activeBtn ? '#ee4d2d' : '#e0e0e0',
                color: inputValues.activeBtn ? '#fff' : '#999',
                fontWeight: '600',
                padding: '0 20px',
                borderRadius: '4px'
              }}
            >
              Áp dụng
            </button>
          </div>

          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '5px'
            }}
            className="container-voucher custom-scrollbar"
          >
            {dataVoucher && dataVoucher.length > 0 ? (
              dataVoucher.map((item, index) => {
                let percent = '';
                if (item.voucherData.typeVoucherOfVoucherData.typeVoucher === 'percent') {
                  percent = item.voucherData.typeVoucherOfVoucherData.value + '%';
                }
                if (item.voucherData.typeVoucherOfVoucherData.typeVoucher === 'money') {
                  percent = CommonUtils.formatter.format(
                    item.voucherData.typeVoucherOfVoucherData.value
                  );
                }
                let MaxValue = CommonUtils.formatter.format(
                  item.voucherData.typeVoucherOfVoucherData.maxValue
                );

                return (
                  <VoucherItemSmall
                    closeModalFromVoucherItem={closeModalFromVoucherItem}
                    data={item}
                    id={item.id}
                    key={index}
                    name={item.voucherData.codeVoucher}
                    maxValue={MaxValue}
                    usedAmount={
                      Math.round(
                        ((item.voucherData.usedAmount * 100) / item.voucherData.amount) * 10
                      ) / 10
                    }
                    typeVoucher={percent}
                  />
                );
              })
            ) : (
              <div className="text-center text-muted my-4">
                <p>Không có voucher nào khả dụng cho đơn hàng này.</p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-top-0 pt-0">
          <Button color="secondary" onClick={handleCloseModal} style={{borderRadius: '4px'}}>Trở lại</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
export default VoucherModal;
