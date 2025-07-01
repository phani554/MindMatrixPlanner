import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    githubId: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        
    },

    username: {
        type: String,
        default: null,
    },

    role: {
        type: String,
        enum: ['developer','tester', 'admin'],
        required: true,
    },

    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
    },

    birthDate: {
        type: Date,
        default: null,
    }, 

    joiningDate: {
        type: Date,
        default: null,
    },

    email: {
        type: String,
        default: null,
    },

    contactNumber: {
        type: String,
        default: null,
    },
     
},{
    timestamps: true
} );

export const Employee = mongoose.model("Employee", employeeSchema);