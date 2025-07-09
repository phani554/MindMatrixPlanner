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
    // --- HIERARCHY & OWNERSHIP FIELDS ---
    isModuleOwner: { 
        type: Boolean, 
        default: false, 
        index: true 

    },
    isTeamLead: { 
        type: Boolean, 
        default: false, 
        index: true 

    }, 
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    // --- OPTIONAL & SYNCED FIELDS ---
    githubId: {
        type: Number,
        unique: true,
        required: true,
        index: true
    },
    username: {
        type: String,
        default: null,
        unique: true,
        trim: true
    },
    modules: [{
        type: String,
        trim: true // Clean up whitespace from module names
    }],
    office: {
        type: String,
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
 * Retrieves the complete organizational context for a given employee.
 * Fetches the employee, their manager, their direct reports, and their peers (colleagues).
 * @param {string|ObjectId} employeeIdOrName - The _id or unique name of the employee.
 * @returns {Promise<Object>} An object containing the employee's organizational chart.
 */
employeeSchema.statics.getOrgChart = async function(employeeIdOrName) {
    const findCondition = mongoose.Types.ObjectId.isValid(employeeIdOrName)
        ? { _id: employeeIdOrName }
        : { name: employeeIdOrName };

    const employee = await this.findOne(findCondition).populate('reportsTo', 'name role');
    if (!employee) {
        throw new Error(`Employee not found with identifier: ${employeeIdOrName}`);
    }

    const [directReports, peers] = await Promise.all([
        // Find everyone who reports to this employee
        this.find({ reportsTo: employee._id }).select('name role modules'),
        // Find everyone else who reports to this employee's manager (if they have one)
        employee.reportsTo ? this.find({ reportsTo: employee.reportsTo._id, _id: { $ne: employee._id } }).select('name role modules') : Promise.resolve([])
    ]);

    return {
        employee: { 
            name: employee.name, 
            role: employee.role, 
            isModuleOwner: employee.isModuleOwner, 
            isTeamLead: employee.isTeamLead,
            modules: employee.modules
        },
        manager: employee.reportsTo || null,
        directReports,
        peers,
    };
};
/**
 * Finds all employees flagged as Module Owners.
 * @returns {Promise<Array>} A promise that resolves to an array of module owner documents.
 */
employeeSchema.statics.getModuleOwners = async function() {
    return this.find({ isModuleOwner: true })
               .select('name role modules')
               .sort({ name: 1 });
};

/**
 * Finds all employees flagged as Team Leads and lists their direct reports.
 * @returns {Promise<Array>} A promise that resolves to an array of team leads, each with their team members.
 */
employeeSchema.statics.getTeamLeadsWithReports = async function() {
    const teamLeads = await this.find({ isTeamLead: true })
                                 .select('name role modules')
                                 .lean(); // .lean() for faster processing

    for (const lead of teamLeads) {
        const reports = await this.find({ reportsTo: lead._id })
                                   .select('name role modules');
        lead.directReports = reports;
    }
    return teamLeads;
};

export const Employee = mongoose.model("Employee", employeeSchema);