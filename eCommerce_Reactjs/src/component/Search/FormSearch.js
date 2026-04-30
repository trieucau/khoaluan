import React from 'react';
import { useEffect, useState } from 'react';

import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';

const FormSearch = (props) => {
  const [keyword, setkeyword] = useState('');

  let handleSearchProduct = () => {
    props.handleSearch(keyword);
  };
  let handleOnchange = (keyword) => {
    setkeyword(keyword);
    props.handleOnchange(keyword);
  };

  return (
    <form style={{ margin: 0, width: '100%' }}>
      <div className="form-group" style={{ margin: 0 }}>
        <div className="input-group" style={{ display: 'flex', flexWrap: 'nowrap', width: '100%' }}>
          <input
            style={{ flex: 1, borderRadius: '8px 0 0 8px', border: '1px solid #E4D8E1', boxShadow: 'none' }}
            onChange={(e) => handleOnchange(e.target.value)}
            value={keyword}
            type="text"
            className="form-control"
            placeholder={`Tìm kiếm ${props.title}`}
          />
          <div className="input-group-append">
            <button 
              onClick={() => handleSearchProduct()} 
              className="btn" 
              type="button"
              style={{ borderRadius: '0 8px 8px 0', border: '1px solid #E4D8E1', borderLeft: 'none', background: '#fff', color: '#FF6B9D' }}
            >
              <i className="ti-search" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
export default FormSearch;
