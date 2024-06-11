import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Define the directory where your static files are located
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

const weatherSchema = new mongoose.Schema({
    city: String,
    data: Object,
    updatedAt: { type: Date, default: Date.now }
});

const Weather = mongoose.model('Weather', weatherSchema);

// Serve index.html at the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/weather/:city', async (req, res) => {
    const { city } = req.params;

    try {
        const weather = await Weather.findOne({ city });

        if (weather && (Date.now() - weather.updatedAt.getTime()) < 60000) {
            return res.json(weather.data);
        }

        const API_KEY = '30d38b26954359266708f92e1317dac0';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();

        if (!weather) {
            await new Weather({ city, data }).save();
        } else {
            weather.data = data;
            weather.updatedAt = new Date();
            await weather.save();
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Error fetching weather data');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
