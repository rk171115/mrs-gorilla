const express = require('express');
const { JWT } = require('google-auth-library');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration - replace with your actual values
const FIREBASE_PROJECT_ID = 'homestage-51e95';
const SERVICE_ACCOUNT = require('./homestage-51e95-01347ccdc6d4.json'); // Your service account file

// Get Access Token (matches your PHP getAccessToken function)
async function getAccessToken() {
    const jwtClient = new JWT({
        email: SERVICE_ACCOUNT.client_email,
        key: SERVICE_ACCOUNT.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
    
    const tokens = await jwtClient.authorize();
    return tokens.access_token;
}

// Send Notification to Artist (matches your PHP sendNotificationArtist function)
app.post('/api/send-notification-artist', async (req, res) => {
    try {
        const { fcm_token, type, status } = req.body;
        
        if (!fcm_token) {
            return res.status(400).json({ 
                success: false, 
                error: 'FCM token is required' 
            });
        }

        const accessToken = await getAccessToken();
        
        const notificationTitle = status 
            ? 'Sorry, User cancelled the booking' 
            : 'You have got a booking by the user';
            
        const notificationBody = status 
            ? 'Sorry, User cancelled the booking' 
            : 'You have got a booking by the user';

        const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;
        
        const response = await axios.post(fcmUrl, {
            message: {
                notification: {
                    title: notificationTitle,
                    body: notificationBody
                },
                data: {
                    type: type
                },
                token: fcm_token
            }
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ 
            success: true, 
            response: response.data 
        });
    } catch (error) {
        console.error('Error sending notification:', error);
        
        if (error.response) {
            res.status(error.response.status).json({ 
                success: false, 
                error: error.response.data 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                error: error.message 
            });
        }
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test endpoint at POST http://localhost:${PORT}/api/send-notification-artist`);
});