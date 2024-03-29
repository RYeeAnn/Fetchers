const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); 

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001; // You can change the port if needed

// Endpoint to fetch orders
app.get('/orders', async (req, res) => {
    try {
        // Make a GET request to the company's endpoint to fetch orders
        const response = await axios.get('https://sniffandbark.com.co/admin/api/2024-01/orders.json?limit=250', {
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
            }
        });

        // Extract the order data from the response and send it back to the client
        const orders = response.data;
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
