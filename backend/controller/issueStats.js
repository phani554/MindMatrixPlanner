import { db } from "../db/dbConnect";
import mongoose from "mongoose";
import dotenv from dotenv;
import path from "path";

dotenv.config({
     path: "C:/Users/admin/Documents/planner/MindMatrixPlanner/backend/.env" 
});

const uri = process.env.MONGO_DB_URI;


try {
    await db.DBconnect(uri);
    connection = mongoose.connection;

    


} catch (error) {
    
}