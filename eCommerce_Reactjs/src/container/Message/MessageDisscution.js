import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
function MessageDisscution(props) {
  const [dataRoom, setdataRoom] = useState([]);
  const [textSearch, settextSearch] = useState('');
  var count;
  useEffect(() => {
    if (props.data) {
      loadRoom(props.data);
    }
  }, [props.data]);
  let handleClickRoom = (roomId) => {
    props.handleClickRoom(roomId);
  };
  let loadRoom = async (data) => {
    data = data.sort((a, b) => {
      let count1 = 0;
      let count2 = 0;
      a.messageData.forEach((item) => {
        if (item.unRead === 1) count1 = count1 + 1;
      });
      b.messageData.forEach((item) => {
        if (item.unRead === 1) count2 = count2 + 1;
      });
      return count2 - count1;
    });
    setdataRoom(data);
  };
  let handleOnchangeSearch = (e) => {
    settextSearch(e.target.value);
  };
  let handleSearchRoom = (roomList) => {
    dataRoom.forEach((item) => {
      let name = '';
      if (props.isAdmin === true) {
        name = item.userOneData.firstName + ' ' + item.userOneData.lastName;
      } else {
        name = item.userTwoData.firstName + ' ' + item.userTwoData.lastName;
      }

      if (name.toLowerCase().indexOf(textSearch.toLowerCase()) !== -1) {
        roomList.push(item);
      }
    });
  };
  let roomList = [];
  handleSearchRoom(roomList);
  return (
    <div className="col-md-3 border-right">
      <div className="d-flex flex-column align-items-center text-center">
        <div className="ks-search d-flex">
          <span className="fa fa-search" />
          <input
            onChange={(e) => handleOnchangeSearch(e)}
            value={textSearch}
            id="input-group-icon-text"
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo tên"
          />
        </div>

        <div className="ks-body">
          {roomList &&
            roomList.length > 0 &&
            roomList.map((item, index) => {
              let userData = {};
              count = 0;
              props.isAdmin === true
                ? (userData = item.userOneData)
                : (userData = item.userTwoData);
              item.messageData.forEach((element) => {
                if (element.unRead === 1 && element.userId !== props.userId) count = count + 1;
              });
              return (
                <div>
                  <div onClick={() => handleClickRoom(item.id)} key={index} className="ks-item">
                    <div className="ks-avatar">
                      <img src={userData.image} width={36} height={36} />
                      <span className="badge badge-pill badge-danger ks-badge ks-notify">
                        {count && count > 0 ? count : ''}
                      </span>
                    </div>
                    <div className="ks-body">
                      <div className="ks-name"> {userData.firstName + ' ' + userData.lastName}</div>
                    </div>
                  </div>
                  <div className="ks-message">
                    {item.messageData && item.messageData.length > 0
                      ? item.messageData[item.messageData.length - 1].text
                      : 'Chưa có tin nhắn'}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default MessageDisscution;
