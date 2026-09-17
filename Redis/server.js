import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import userModel from './models/user.model.js';
import rateLimit from 'express-rate-limit';








// ------MongoDB Connection------
const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB Connection Error: ", error);
        process.exit(1);
    }
};

connectToDB();

// -----Redis Connection-------
const redis = new Redis(process.env.REDIS_URI);

redis.once('ready', () => {
    console.log("Connected to Redis");
});


// ----Express App Setup-----

const app = express();
app.use(morgan('dev'));
app.use(express.json());

// ------ ejs Template Engine Setup ------
app.set('view engine', 'ejs');

app.set('views','./views');

app.use(express.static('public'));

const globalLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.'
  },
  statusCode: 429,
  standardHeaders: true,   // sends RateLimit-* headers
  legacyHeaders: false,
});

// Apply to every route
app.use(globalLimiter);



// ----- Routes -----
app.get('/user/:id', async (req, res) => {
    try {
        const userFromCache = await redis.get(`user: ${req.params.id}`);
        if(userFromCache) {
            return res.json({
                message: "User fetched from cache",
                data: JSON.parse(userFromCache)
            });
        }
        const user = await userModel.findOne({_id: req.params.id});

        await redis.set(`user: ${req.params.id}`, JSON.stringify(user), "EX", 60 * 60);

        res.status(200).json({
            message: "User fetched successfully.",
            data: user
        });
    } catch (error) {
        res.status(500).json({
            error: "Error fetching users"
        });
    }
});

app.post('/user', async (req, res) => {
    try {
        const newUser = new userModel(req.body);
        await newUser.save();
        res.json({
            message: "User created successfully.",
            data: newUser
        });
    } catch (error) {
        res.status(500).json({
            error: "Error creating user"
        });
    }
});

app.get('/', async (req, res) => {
    res.render('index', {
        username: "Cohort User",
        bio: "Something new cohort",
        profilePicture: "https://images.unsplash.com/photo-1789207051591-05b3c423cc14?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8"
    });
});

// ------ Start Server -----

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});