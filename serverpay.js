const express = require('express');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = 3000;

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_vl7yYnDYiXhLns',
  key_secret: 'HzmDHln6QG2IcGKU4MSilzK3'
});
// Serve static files (e.g., index.html) from the 'public' directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to create an order
app.post('/create-order', async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const options = {
    amount: amount * 100, // amount in paise
    currency: 'INR',
    receipt: crypto.randomBytes(10).toString('hex')
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Endpoint to verify payment
app.post('/verify-payment', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  const generated_signature = crypto.createHmac('sha256', 'HzmDHln6QG2IcGKU4MSilzK3')
                                    .update(`${order_id}|${payment_id}`)
                                    .digest('hex');

  if (generated_signature === signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Signature mismatch' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
