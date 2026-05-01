const axios = require('axios');
axios.get('http://localhost:8080/api/get-all-user?limit=10&offset=0&keyword=').then(res => console.log(Object.keys(res.data.data[0]))).catch(e => console.log(e));
