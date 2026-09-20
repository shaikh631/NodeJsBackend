import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors';

const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit :" 16kb"}))
app.use(express.urlencoded({extended: true , limit : "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())


// routes
import userRoutes from './routes/user.routes.js'

app.use('/api/v1/users' , userRoutes);

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        errors: error.error || []
    });
});

export {app} 


