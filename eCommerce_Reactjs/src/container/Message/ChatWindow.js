import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import { loadMessage } from '../../services/userService';
import moment from 'moment';

const host = process.env.REACT_APP_BACKEND_URL;
function ChatWindow(props) {
  const LIMIT = 10;
  const [offset, setOffset] = useState(LIMIT);
  const [hasMore, setHasMore] = useState(true);
  const boxChatRef = useRef(null);
  const [mess, setMess] = useState([]);
  const [userData, setuserData] = useState({});
  const [message, setMessage] = useState('');
  const [id, setId] = useState();
  const [user, setUser] = useState({});
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIOClient.connect(host);
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUser(userData);

    socketRef.current.on('getId', (data) => {
      setId(data);
    }); // phần này đơn giản để gán id cho mỗi phiên kết nối vào page. Mục đích chính là để phân biệt đoạn nào là của mình đang chat.

    if (props.roomId) {
      socketRef.current.emit('joinRoom', props.roomId); // ← join room khi mở chat
      fetchMessage();
    }
    socketRef.current.off('sendDataServer');
    socketRef.current.on('sendDataServer', () => {
      fetchMessage();
      setTimeout(() => {
        if (boxChatRef.current) {
          boxChatRef.current.scrollTop = boxChatRef.current.scrollHeight;
        }
      }, 100);
    });
    return () => {
      socketRef.current.emit('leaveRoom', props.roomId); // ← rời room khi đóng
      socketRef.current.off('sendDataServer');
      socketRef.current.disconnect();
    };
  }, [props.roomId]);
  let fetchMessage = async (loadMore = false) => {
    let currentOffset = loadMore ? offset : 0;
    let res = await loadMessage(props.roomId, props.userId, LIMIT, currentOffset);
    if (res && res.data) {
      if (loadMore) {
        setMess((prev) => [...res.data, ...prev]);
        setOffset((prev) => prev + LIMIT);
      } else {
        setMess(res.data);
        setOffset(LIMIT);
        // ← scroll xuống cuối sau khi load lần đầu
        setTimeout(() => {
          if (boxChatRef.current) {
            boxChatRef.current.scrollTop = boxChatRef.current.scrollHeight;
          }
        }, 100);
      }
      setHasMore(res.data.length === LIMIT);
    }
  };
  let sendMessage = () => {
    if (message !== null) {
      const msg = {
        text: message,
        userId: user.id,
        roomId: props.roomId,
        userData: userData,
      };
      socketRef.current.emit('sendDataClient', msg);
      setMessage('');
    }
  };
  return (
    <div className="ks-messages ks-messenger__messages col-md-9 border-right">
      <div className="p-3 py-5">
        <div className="d-flex justify-content-between">
          <span className="ks-name">Chat name | 2 members</span>
          <div className="ks-controls">
            <div className="dropdown">
              <button
                className="btn btn-primary-outline ks-light ks-no-text ks-no-arrow"
                type="button"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="fa fa-ellipsis-h ks-icon" />
              </button>
              <div
                className="dropdown-menu dropdown-menu-right ks-simple"
                aria-labelledby="dropdownMenuButton"
              >
                <a className="dropdown-item" href="#">
                  <span className="fa fa-user-plus ks-icon" />
                  <span className="ks-text"> Add members</span>
                </a>
                <a className="dropdown-item" href="#">
                  <span className="fa fa-eye-slash ks-icon" />
                  <span className="ks-text"> Mark as unread</span>
                </a>
                <a className="dropdown-item" href="#">
                  <span className="fa fa-bell-slash-o ks-icon" />
                  <span className="ks-text"> Mute notifications</span>
                </a>
                <a className="dropdown-item" href="#">
                  <span className="fa fa-mail-forward ks-icon" />
                  <span className="ks-text"> Forward</span>
                </a>
                <a className="dropdown-item" href="#">
                  <span className="fa fa-ban ks-icon" />
                  <span className="ks-text"> Spam</span>
                </a>
                <a className="dropdown-item" href="#">
                  <span className="fa fa-trash-o ks-icon" />
                  <span className="ks-text"> Delete</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div
          className="ks-body ks-scrollable jspScrollable"
          data-auto-height
          data-reduce-height=".ks-footer"
          data-fix-height={32}
          style={{
            overflow: 'hidden',
            padding: '0px',
          }}
          tabIndex={0}
        >
          <div className="jspContainer">
            <div className="jspPane" style={{ padding: '0px', top: '0px' }}>
              <ul
                ref={boxChatRef} // ← dùng ref thay id
                className="ks-items"
                style={{ overflowY: 'scroll', maxHeight: '479px' }}
              >
                {hasMore && (
                  <li style={{ textAlign: 'center', padding: '8px' }}>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchMessage(true)}
                    >
                      Tải tin nhắn cũ hơn
                    </button>
                  </li>
                )}
                {mess &&
                  mess.length > 0 &&
                  mess.map((item, index) => {
                    if (item.userData) {
                      return (
                        <li
                          key={index}
                          className={
                            item.userData.id == user.id ? 'ks-item ks-from' : 'ks-item ks-self'
                          }
                        >
                          <span className="ks-avatar ks-offline">
                            <img
                              src={item.userData.image}
                              width={36}
                              height={36}
                              className="rounded-circle"
                            />
                          </span>
                          <div className="ks-body">
                            <div className="ks-header">
                              <span className="ks-name">
                                {item.userData.firstName + ' ' + item.userData.lastName}
                              </span>
                            </div>
                            <div className="ks-message">{item.text}</div>
                            <span className="ks-name">{moment(item.createdAt).fromNow()}</span>
                          </div>
                        </li>
                      );
                    }
                  })}
              </ul>
            </div>
            <div className="jspVerticalBar">
              <div className="jspCap jspCapTop" />
              <div className="jspTrack">
                <div className="jspDrag">
                  <div className="jspDragTop" />
                  <div className="jspDragBottom" />
                </div>
              </div>
              <div className="jspCap jspCapBottom" />
            </div>
          </div>
        </div>
        <div className="ks-footer">
          <textarea
            onChange={(e) => setMessage(e.target.value)}
            value={message}
            placeholder="Type something..."
            defaultValue={''}
          />
          <div className="ks-controls">
            <button onClick={() => sendMessage()} className="btn btn-primary">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
