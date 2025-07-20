//  create a test request to create an order to 68277bf5f6d75389d7870a46 product from 66c4e2a1e13e2a001f7b1d01 vendor from 685c1c65aa2120e932680d9a user

import axios from 'axios';

const createOrder = async () => {
  try {
    const response = await axios.post('http://localhost:3000/orders', {
      product_id: '68277bf5f6d75389d7870a46',
      vendor_id: '66c4e2a1e13e2a001f7b1d01',
      user_id: '685c1c65aa2120e932680d9a',
      quantity: 1,
      pickup_location: [12.9715987, 77.594566],
      drop_location: [12.2958104, 76.6393805],
    });

    console.log('Order created successfully:', response.data);
  } catch (error : any) {
    console.error('Error creating order:', error.response ? error.response.data : error.message);
  }
};

createOrder();