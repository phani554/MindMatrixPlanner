import mongoose from "mongoose";

const syncConfigSchema = new mongoose.Schema({
  lastUpdatedAt: {
    type: Date,
    default: null
  },
  totalIssuesLog: {
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
  totalPr: {
    type: Number,
    default: null
  }
});

export  const SyncConfig = mongoose.model("SyncConfig", syncConfigSchema);