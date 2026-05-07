import React, { useState, useEffect } from 'react';
import VoucherItem from '../Voucher/VoucherItem';
import logoVoucher from '../../../src/resources/img/logoVoucher.png';
import { BrowserRouter as Router, Switch, Route, Link, Redirect } from 'react-router-dom';
import './StoreVoucher.scss';
import VoucherItemSmall from './VoucherItemSmall';
import { getAllVoucherByUserIdService } from '../../services/userService';
import moment, { now } from 'moment';
import { toast } from 'react-toastify';
import { PAGINATION } from '../../utils/constant';
import CommonUtils from '../../utils/CommonUtils';
function StoreVoucher(props) {
  const [inputValues, setInputValues] = useState({
    codeVoucher: '',
    activeBtn: false,
  });
  const [dataVoucher, setdataVoucher] = useState([]);
  const [count, setCount] = useState('');
  const [numberPage, setnumberPage] = useState('');
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
          limit: PAGINATION.pagerow,
          offset: 0,
          id: props.id,
        });
        let arrTemp = [];
        if (arrData && arrData.errCode === 0) {
          let nowDate = moment().startOf('day');

          let filteredVouchers = arrData.data.filter(item => {
            let toDate = moment.unix(item.voucherData.toDate / 1000).endOf('day');
            let fromDate = moment.unix(item.voucherData.fromDate / 1000).startOf('day');
            let amount = item.voucherData.amount;
            let usedAmount = item.voucherData.usedAmount;

            return (
              amount !== usedAmount &&
              toDate.isSameOrAfter(nowDate) &&
              fromDate.isSameOrBefore(nowDate)
            );
          });
          
          setdataVoucher(filteredVouchers);
          setCount(Math.ceil(arrData.count / PAGINATION.pagerow));
        }
      };
      fetchData();
    }
  }, [props.id]);

  return (
    <div className="store-voucher-container">
      <div className="container">
        <div className="row">
          <div className="col-md-12">
            <div className="voucher-wallet-card">
              <div className="wallet-header">
                <div className="header-title">
                  <i className="fa-solid fa-ticket-simple" />
                  <h2>Ví Voucher của tôi</h2>
                </div>
                <div className="header-subtitle">
                  Lưu trữ và quản lý tất cả mã giảm giá của bạn tại đây
                </div>
              </div>

              <div className="voucher-content">
                {dataVoucher && dataVoucher.length > 0 ? (
                  <div className="voucher-grid">
                    {dataVoucher.map((item, index) => {
                      let percent = '';
                      if (item.voucherData.typeVoucherOfVoucherData.typeVoucher === 'percent') {
                        percent = item.voucherData.typeVoucherOfVoucherData.value + '%';
                      } else {
                        percent = CommonUtils.formatter.format(item.voucherData.typeVoucherOfVoucherData.value);
                      }
                      
                      let MaxValue = CommonUtils.formatter.format(item.voucherData.typeVoucherOfVoucherData.maxValue);

                      return (
                        <VoucherItemSmall
                          id={item.id}
                          key={index}
                          name={item.voucherData.codeVoucher}
                          widthPercent={(item.voucherData.usedAmount * 100) / item.voucherData.amount}
                          maxValue={MaxValue}
                          usedAmount={Math.round(((item.voucherData.usedAmount * 100) / item.voucherData.amount) * 10) / 10}
                          typeVoucher={percent}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="voucher-empty-state">
                    <div className="empty-icon">
                      <i className="fa-solid fa-tags" />
                    </div>
                    <h3>Chưa có voucher nào</h3>
                    <p>Hãy khám phá thêm nhiều ưu đãi hấp dẫn tại cửa hàng</p>
                    <Link to="/voucher" className="btn-explore">Khám phá ngay</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoreVoucher;
