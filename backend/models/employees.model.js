// src/models/employee.model.js

import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
    // --- REQUIRED FIELDS ---
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['developer', 'tester', 'admin']
    },

    // --- OPTIONAL & SYNCED FIELDS ---
    githubId: {
        type: Number,
        unique: true,
        sparse: true, // IMPORTANT: Allows multiple nulls but unique for actual values
        index: true
    },
    username: {
        type: String,
        default: null,
        trim: true
    },
    modules: [{
        type: String,
        trim: true // Clean up whitespace from module names
    }],
    isModuleOwner: {
        type: Boolean,
        default: false,
        index: true // Index for faster queries on owners
    },
    office: {
        type: String,
        default: null
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // IMPORTANT: Allows multiple nulls but unique for actual values
        trim: true
    },
    birthDate: {
        type: Date,
        default: null
    },
    joiningDate: {
        type: Date,
        default: null
    },
    contactNumber: {
        type: String,
        default: null
    },
}, {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true
});

/**
 * Finds all developers and testers associated with a specific module.
 * It explicitly EXCLUDES other roles like 'admin'.
 * @param {string} moduleName - The name of the module to query (e.g., "Dashboard").
 * @returns {Promise<Array>} A promise that resolves to an array of employee documents.
 */
employeeSchema.statics.findByModule = async function(moduleName) {
    if (!moduleName || typeof moduleName !== 'string') {
        throw new Error("A valid module name string is required.");
    }

    const filter = {
        modules: moduleName,
        role: { $in: ['developer', 'tester'] }
    };

    // Sort owners to the top, then by name
    return this.find(filter)
               .populate('reportsTo', 'name email')
               .sort({ isModuleOwner: -1, name: 1 });
};

export const Employee = mongoose.model("Employee", employeeSchema);