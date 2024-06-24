const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        user.isSubscribed = false;
        await user.save();

        // Sending HTML response
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Unsubscribe Confirmation</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f0f0f0;
                        text-align: center;
                        padding: 50px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 5px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    h1 {
                        color: #333;
                    }
                    p {
                        color: #666;
                        font-size: 16px;
                    }
                    .btn {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #3B82F6;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 5px;
                        transition: background-color 0.3s ease;
                    }
                    .btn:hover {
                        background-color: #2563EB;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Unsubscribe Confirmation</h1>
                    <p>You have successfully unsubscribed from our emails.</p>
                    <a href="https://quick-pay-gamma.vercel.app/" class="btn">Back to Homepage</a>
                </div>
            </body>
            </html>
        `);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
