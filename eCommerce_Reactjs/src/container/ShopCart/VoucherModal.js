import React from 'react';
import { useEffect, useState } from 'react';

import moment from 'moment';
import { toast } from 'react-toastify';

import { Modal, ModalHeader, ModalFooter, ModalBody, Button } from 'reactstrap';
import '../User/StoreVoucher.scss';
import { getAllVoucherByUserIdService } from '../../services/userService';
import CommonUtils from '../../utils/CommonUtils';
import VoucherItemSmall from '../User/VoucherItemSmall';

const VoucherModal = (props) => {
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
  }, [props.isOpenModal]);
  const handleOnChange = (event) => {
    const { name, value } = event.target;

    if (value !== '') {
      setInputValues({ ...inputValues, ['activeBtn']: true, [name]: value });
    } else {
      setInputValues({ ...inputValues, ['activeBtn']: false, [name]: value });
    }
  };

  let closeModalFromVoucherItem = () => {
    props.closeModalFromVoucherItem();
  };
  return (
    <div className="">
      <Modal isOpen={props.isOpenModal} className={'booking-modal-container'} size="md" centered>
        <div className="modal-header">
          <h5 className="modal-title">Chọn Eiser Voucher</h5>
          <button
            onClick={handleCloseModal}
            type="button"
            className="btn btn-time"
            aria-label="Close"
          >
            X
          </button>
        </div>
        <ModalBody>
          <div
            style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            className="container-voucher"
          >
            {dataVoucher &&
              dataVoucher.length > 0 &&
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
              })}
          </div>
        </ModalBody>
        <ModalFooter>
          {' '}
          <Button onClick={handleCloseModal}>Hủy</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
export default VoucherModal;
