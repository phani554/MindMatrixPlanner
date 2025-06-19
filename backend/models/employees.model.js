import { mongoose, Schema } from "mongoose";

const employeSchema = new Schema({
    EmpId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
     
}, )