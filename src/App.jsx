import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.scss';
import * as XLSX from 'xlsx';

function App() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportCount, setExportCount] = useState(250); // Default export count

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3001/orders');
      console.log('Data fetched:', response.data);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
        setLoading(false);
      } else if (response.data && Array.isArray(response.data.orders)) {
        setOrders(response.data.orders);
        setLoading(false);
      } else {
        setError('Invalid data format received.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error fetching orders. Please try again later.');
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const fileType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';
  
    const formattedData = [];
    const columnHeaders = ['Order #', 'Product Name', '', '', '', 'COGS', '', 'SKU'];
    let previousOrderNumber = null;

    formattedData.push(Array(columnHeaders.length).fill(''));

    const exportData = orders.slice(0, exportCount); // Slice the orders array based on exportCount
    
    exportData.forEach(order => {
      const orderNumber = order.name;
      let isFirstProduct = true;
      let totalOrderPrice = 0;

      order.line_items.forEach((item, index) => {
        const orderInfo = isFirstProduct ? orderNumber : '';
        const productName = getProductTypeFromSKU(item.sku);
        const productPrice = getProductPrice(productName, index);
        formattedData.push([orderInfo, productName, '', '', '', productPrice, '', item.sku]);
        totalOrderPrice += productPrice;

        isFirstProduct = false;
      });

      formattedData.push([isFirstProduct ? orderNumber : '', '', '', '', 'Total', totalOrderPrice, '', '']);
    });

    formattedData.unshift(columnHeaders);

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: fileType });
    const filename = 'orders' + fileExtension;
    XLSX.writeFile(wb, filename);
  };
  

  function getProductTypeFromSKU(sku) {
    if (!sku) {
        return 'Custom Engraving';
    }

    const skuMappings = {
        '^CA\\d{1,3}K(-XS|-S|-M|-L|-XL)?$': 'Bandana',
        '^CA\\d{1,3}(-XS|-S|-M|-L|-XL)?$': 'Collar',      
        '^CA\\d{1,3}A(-XS|-S|-M|-L|-XL)?$': 'Bow Tie Collar',
        '^CA\\d{1,3}F(-XS|-S|-M|-L|-XL)?$': 'Flower Collar',
        '^CA\\d{1,3}H(-XS|-S|-M|-L|-XL)?$': 'Harness',
        '^CA\\d{1,3}B(-XS|-S|-M|-L|-XL)?$': 'Leash',
        '^CA\\d{1,3}P(-XS|-S|-M|-L|-XL)?$': 'Poop Bag Holder',
        '^CA\\d{1,3}BP(-XS|-S|-M|-L|-XL)?$': 'Leash + Poop Bag Holder',
        '^CA\\d{1,3}AB(-XS|-S|-M|-L|-XL)?$': 'Bow Tie Collar & Leash',
        '^CA\\d{1,3}FB(-XS|-S|-M|-L|-XL)?$': 'Flower Collar & Leash',

        '^CAC\\d{1,3}K(-XS|-S|-M|-L|-XL)?$': 'Bandana',
        '^CAC\\d{1,3}(-XS|-S|-M|-L|-XL)?$': 'Collar',
        '^CAC\\d{1,3}A(-XS|-S|-M|-L|-XL)?$': 'Bow Tie Collar',
        '^CAC\\d{1,3}F(-XS|-S|-M|-L|-XL)?$': 'Flower Collar',
        '^CAC\\d{1,3}H(-XS|-S|-M|-L|-XL)?$': 'Harness',
        '^CAC\\d{1,3}B(-XS|-S|-M|-L|-XL)?$': 'Leash',
        '^CAC\\d{1,3}P(-XS|-S|-M|-L|-XL)?$': 'Poop Bag Holder',
        '^CAC\\d{1,3}BP(-XS|-S|-M|-L|-XL)?$': 'Leash + Poop Bag Holder',
        '^CAC\\d{1,3}AB(-XS|-S|-M|-L|-XL)?$': 'Bow Tie Collar & Leash',
        '^CAC\\d{1,3}FB(-XS|-S|-M|-L|-XL)?$': 'Flower Collar & Leash',

        '^CA\\d{1,3}bundle(-XS|-S|-M|-L|-XL)?$': 'Bundle',
        '^CAC\\d{1,3}bundle(-XS|-S|-M|-L|-XL)?$': 'Bundle',

        '^CA\\d+[A-Z]*-MB(-XS|-S|-M|-L|-XL)?$': 'Bow Mega Bundle',
        '^CA\\d+[A-Z]*-MB(-XS|-S|-M|-L|-XL)?$': 'Flower Mega Bundle',

        '^CAC\\d+[A-Z]*-MB(-XS|-S|-M|-L|-XL)?$': 'Bow Mega Bundle',
        '^CAC\\d+[A-Z]*-MB(-XS|-S|-M|-L|-XL)?$': 'Flower Mega Bundle',

        '^CA\\d{1,3}Y(-XS|-S|-M|-L|-XL)?$': 'Cozy Fleece Vest',
        '^CA\\d{1,3}Z(-XS|-S|-M|-L|-XL)?$': 'Zoomies Rain Vest',

        '^CAC\\d{1,3}Y(-XS|-S|-M|-L|-XL)?$': 'Cozy Fleece Vest',
        '^CAC\\d{1,3}Z(-XS|-S|-M|-L|-XL)?$': 'Zoomies Rain Vest'
    };

    for (const pattern in skuMappings) {
        if (new RegExp(pattern).test(sku)) {
            return skuMappings[pattern];
        }
    }

    return 'Unidentified';
}

function getProductPrice(productName, index) {
  const productPrices = {
      'Bandana': {
          'alone': 10.99,
          '2nd': 2.99,
          '3rd': 2.99
      },
      'Collar': {
          'alone': 13.99,
          '2nd': 8.99,
          '3rd': 7.99
      },
      'Bow Tie Collar': {
          'alone': 15.99,
          '2nd': 11.49,
          '3rd': 10.49
      },
      'Flower Collar': {
          'alone': 16.99,
          '2nd': 12.00,
          '3rd': 11.49
      },
      'Harness': {
          'alone': 14.99,
          '2nd': 11.99,
          '3rd': 10.99
      },
      'Leash': {
          'alone': 12.99,
          '2nd': 6.99,
          '3rd': 6.99
      },
      'Poop Bag Holder': {
          'alone': 10.99,
          '2nd': 2.99,
          '3rd': 2.99
      },
      'Leash + Poop Bag Holder': {
          'alone': 15.98,
          '2nd': 9.98,
          '3rd': 9.98
      },
      'Bow Tie Collar & Leash': {
          'alone': 19.99,
          '2nd': 15.99,
          '3rd': 15.49
      },
      'Flower Collar & Leash': {
        'alone': 19.99,
        '2nd': 15.99,
        '3rd': 15.49
      },
      'Bundle': {
          'alone': 23.99,
          '2nd': 18.99,
          '3rd': 17.99
      },
      'Bow Mega Bundle': {
          'alone': 31.99,
          '2nd': 26.99,
          '3rd': 26.99
      },
      'Flower Mega Bundle': {
          'alone': 31.99,
          '2nd': 26.99,
          '3rd': 26.99
      },
      'Cozy Fleece Vest': {
        'alone': 0.00,
        '2nd': 0.00,
        '3rd': 0.00
      },
      'Zoomies Rain Vest': {
        'alone': 0.00,
        '2nd': 0.00,
        '3rd': 0.00
      },
      'Custom Engraving': {
          'alone': 6.99,
          '2nd': 6.99,
          '3rd': 6.99
      },
  };

  if (productPrices[productName]) {
      let category;
      if (index === 0) {
          category = 'alone';
      } else if (index === 1) {
          category = '2nd';
      } else {
          category = '3rd';
      }
      return productPrices[productName][category];
  } else {
      return 0.00;
  }
}

  return (
    <div className="app">
      <header className="app-header">
        <h1 className='app-title'>Orders</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <>
            <div className="export-options">
              <input 
                type="number" 
                value={exportCount} 
                onChange={(e) => setExportCount(e.target.value)} 
                min={1} 
                max={250} 
                placeholder="Enter export count (1-250)"
                className="export-input"
              />
              <button className='export-button' onClick={exportToExcel}>Export to Excel</button>
            </div>
            <ul className="order-list">
              {orders.map(order => (
                <li key={order.id}>
                  <div className="order-info">
                    <div>
                      <span className="order-number">Order:</span> <b>{order.name}</b>
                    </div>
                    <div>
                      <span className="customer-name">Customer:</span> <b>{order.billing_address.name}</b>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </header>
    </div>
  );
}


export default App;