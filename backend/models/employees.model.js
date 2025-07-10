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

// --- ADDED START: New static method for hierarchical lookup ---
/**
 * Retrieves all GitHub IDs for an employee's entire reporting hierarchy,
 * including direct and indirect reports down the chain.
 * @param {number} teamLeadGithubId - The GitHub ID of the top-level manager.
 * @returns {Promise<number[]>} A promise that resolves to an array of all subordinate GitHub IDs.
 */
employeeSchema.statics.getReportingHierarchyIds = async function(teamLeadGithubId) {
    // 1. Find the MongoDB _id of the starting team lead.
    const lead = await this.findOne({ githubId: teamLeadGithubId }).select('_id').lean();
    if (!lead) {
        return []; // If the lead doesn't exist, the hierarchy is empty.
    }

    // 2. Use a MongoDB Aggregation Pipeline with $graphLookup to traverse the hierarchy.
    const pipeline = [
        // Stage A: Start with the specified team lead.
        { $match: { _id: lead._id } },
        
        // Stage B: Traverse the reporting chain.
        {
            $graphLookup: {
                from: 'employees',           // The collection to search in.
                startWith: '$_id',           // Start the search with the lead's _id.
                connectFromField: '_id',     // In a manager's document, use their _id...
                connectToField: 'reportsTo', // ...to connect to another employee's reportsTo field.
                as: 'reportingChain',        // Store the array of all found subordinates here.
                depthField: 'depth'          // Optional: Adds a 'depth' field (0 for direct reports).
            }
        },
        
        // Stage C: The result is one document with the `reportingChain` array. We need to extract the IDs.
        { $project: {
            _id: 0,
            // Use $map to transform the array of employee documents into an array of just their GitHub IDs.
            allReportIds: {
                $map: {
                    input: '$reportingChain',
                    as: 'report',
                    in: '$$report.githubId'
                }
            }
        }}
    ];
    
    const result = await this.aggregate(pipeline);

    // If a result is found, return the array of IDs; otherwise, return an empty array.
    return result.length > 0 ? result[0].allReportIds : [];
};

/**
 * Retrieves a sorted list of all unique module names from the entire collection.
 * @returns {Promise<string[]>} A promise that resolves to an array of unique module strings.
 */
employeeSchema.statics.getAllModuleNames = async function() {
    try {
        const pipeline = [
            // Stage 1: Deconstruct the 'modules' array field from each document.
            { $unwind: "$modules" },
            
            // Stage 2: Group by the module names to get unique values.
            { $group: { _id: "$modules" } },
            
            // Stage 3: Sort the unique module names alphabetically.
            { $sort: { _id: 1 } },
            
            // Stage 4: Project the result into a simple array of strings.
            { $group: { _id: null, modules: { $push: "$_id" } } },
            { $project: { _id: 0, modules: 1 } }
        ];

        const result = await this.aggregate(pipeline);
        
        return result.length > 0 ? result[0].modules : [];
    } catch (error) {
        console.error("Error fetching all module names:", error);
        return [];
    }
};
// --- ADDED END ---

export const Employee = mongoose.model("Employee", employeeSchema);