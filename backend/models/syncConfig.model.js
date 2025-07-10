import mongoose from "mongoose";

const syncConfigSchema = new mongoose.Schema({
  // 💼 Employee sync info
  employeeSync: {
    lastUpdatedAt: { 
      type: Date, 
      default: null 

    },
    updated: { 
      type: Number, 
      default: null 

    },
    inserted: { 
      type: Number, 
      default: null 

    },
    deleted: { 
      type: Number, 
      default: null 

    },
    deletionsSkipped: { 
      type: Number, 
      default: null 
    },
  },

  // 🐛 Issue/PR sync info
  issueSync: {
    lastUpdatedAt: { 
      type: Date, 
      default: null 

    },
    totalIssuesLog: { 
      type: Number, 
      default: null 

    },
    totalPr: { 
      type: Number, 
      default: null 

    },
    totalPrMerged: { 
      type: Number, 
      default: null 

    },
    totalIssueClosed: {
      type: Number, 
      default: null 
    },
  }

});

export const SyncConfig = mongoose.model("SyncConfig", syncConfigSchema);
