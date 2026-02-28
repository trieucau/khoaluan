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
            if (
              amount !== usedAmount &&
              compareDates(toDate, nowDate) === false &&
              compareDates(fromDate, nowDate) === true
            ) {
              arrTemp[i] = arrData.data[i];
            }
          }
          setdataVoucher(arrTemp);
          setCount(Math.ceil(arrData.count / PAGINATION.pagerow));
        }
      };
      fetchData();
    }
  }, [props.id]);

  return (
    <div className="container rounded bg-white mt-5 mb-5">
      <div className="row">
        <div className="col-md-12 border-right border-left">
          <div className="box-heading">
            <div className="content-left">
              <span>Ví voucher</span>
            </div>
          </div>

          <div className="container-voucher">
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
                    id={item.id}
                    key={index}
                    name={item.voucherData.codeVoucher}
                    widthPercent={(item.voucherData.usedAmount * 100) / item.voucherData.amount}
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
        </div>
      </div>
    </div>
  );
}

export default StoreVoucher;
