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
        <div className="modal-header border-bottom-0" style={{ padding: '24px 24px 16px', background: 'var(--c-bg-alt)', borderRadius: 'var(--r-xl) var(--r-xl) 0 0' }}>
          <h5 className="modal-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', color: 'var(--c-text)' }}>
            <i className="fa-solid fa-ticket" style={{ color: 'var(--c-primary)', marginRight: '10px' }}></i>
            Chọn Voucher Khuyến Mãi
          </h5>
          <button
            onClick={handleCloseModal}
            type="button"
            className="close-btn"
            aria-label="Close"
            style={{
              background: 'var(--c-surface)', border: '1px solid var(--c-border)', 
              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-muted)', 
              fontSize: '18px', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--c-primary)'; e.currentTarget.style.borderColor = 'var(--c-primary-light)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--c-text-muted)'; e.currentTarget.style.borderColor = 'var(--c-border)'; }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <ModalBody style={{ padding: '20px 24px', background: 'var(--c-surface)' }}>
          {/* Ô nhập mã Voucher */}
          <div 
            className="voucher-input-group" 
            style={{ 
              display: 'flex', 
              alignItems: 'stretch',
              border: '1.5px solid var(--c-border)', 
              borderRadius: 'var(--r-md)', 
              overflow: 'hidden',
              marginBottom: '24px',
              background: 'var(--c-surface)',
              transition: 'border-color 0.2s',
              height: '48px'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--c-primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; }}
          >
            <input
              type="text"
              placeholder="Mã voucher của bạn..."
              name="codeVoucher"
              value={inputValues.codeVoucher}
              onChange={handleOnChange}
              style={{ 
                flex: 1, 
                border: 'none', 
                padding: '0 16px',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                outline: 'none',
                background: 'transparent',
                minWidth: '100px'
              }}
            />
            <button
              onClick={handleApplyVoucherCode}
              disabled={!inputValues.activeBtn}
              style={{
                background: inputValues.activeBtn ? 'var(--grad-primary)' : 'var(--c-bg-alt)',
                color: inputValues.activeBtn ? '#fff' : 'var(--c-text-muted)',
                opacity: inputValues.activeBtn ? 1 : 0.6,
                cursor: inputValues.activeBtn ? 'pointer' : 'not-allowed',
                padding: '0 24px',
                border: 'none',
                fontFamily: 'var(--font-accent)',
                fontSize: '14px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              Áp dụng
            </button>
          </div>

          <div
            style={{
              maxHeight: '350px',
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '8px'
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
              <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--c-surface-2)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--c-border-strong)' }}>
                <i className="fa-solid fa-ticket-simple" style={{ fontSize: '40px', color: 'var(--c-text-muted)', opacity: 0.5, marginBottom: '16px' }}></i>
                <p style={{ fontFamily: 'var(--font-accent)', fontSize: '15px', fontWeight: '600', color: 'var(--c-text-soft)', margin: 0 }}>
                  Không có voucher nào khả dụng
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--c-text-muted)', marginTop: '4px' }}>
                  Bạn chưa lưu hoặc voucher không áp dụng cho đơn hàng này.
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="border-top-0 pt-0" style={{ padding: '0 24px 24px', background: 'var(--c-surface)', borderRadius: '0 0 var(--r-xl) var(--r-xl)' }}>
          <button 
            onClick={handleCloseModal} 
            style={{
              padding: '10px 24px',
              background: 'transparent',
              border: '2px solid var(--c-border-strong)',
              borderRadius: 'var(--r-full)',
              color: 'var(--c-text-soft)',
              fontFamily: 'var(--font-accent)',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--c-text-soft)'; e.currentTarget.style.color = 'var(--c-text)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--c-border-strong)'; e.currentTarget.style.color = 'var(--c-text-soft)'; }}
          >
            Trở lại
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
export default VoucherModal;
