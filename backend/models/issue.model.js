import mongoose, {Schema} from "mongoose";

const issueSchema = new mongoose.Schema({
    githubId: { type: Number, required: true, unique: true, index: true },
    number: { type: Number, required: true },
    title: { type: String },
    // body: { type: String },
    state: { type: String, index: true },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true },
    closedAt: { type: Date, index: true },
    user: {
      login: { type: String, required: true, index: true },
      id: { type: Number, required: true },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    },
    assignees: [{
      login: { type: String, required: true, index: true },
      id: { type: Number, required: true },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    }],
    labels: [{ type: String, index: true }],
    closedBy: [{
      login: { type: String },
      id: { type: Number },
      name: { 
        type: Schema.Types.ObjectId,
        ref: "Employee",
        default: null  // Set to null initially
      }
    }],
    issueType: { type: String, index: true },
    hasSubIssues: { type: Boolean, default: false },
    htmlUrl: { type: String },
    // parentId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Issue",
    //   default: null,
    // },
    pull_request: { type: Boolean, default: false },
    // sub_issue: { type: Boolean, default: false },
    merged_at: { type: Date, default: null },
    
    
  });
  
  // Create indexes for better query performance
  issueSchema.index({ number: 1, state: 1 });
  issueSchema.index({ 'user.login': 1, createdAt: -1 });
  
  // ==================== BARE MINIMUM METHODS FOR IMMEDIATE USE ====================
  
  // 1. Find my assigned issues (works with login only)
  issueSchema.statics.findByAssignee = function(login) {
    return this.find({ 'assignees.login': login })
      .sort({ updatedAt: -1 });
  };
  
  // 2. Find issues I created (works with login only)
  issueSchema.statics.findByUser = function(login) {
    return this.find({ 'user.login': login })
      .sort({ createdAt: -1 });
  };
  
  // 3. Find open issues
  issueSchema.statics.findOpenIssues = function() {
    return this.find({ state: 'open' }).sort({ updatedAt: -1 });
  };
  
  // 4. Issue age in days (for prioritization)
  issueSchema.virtual('ageInDays').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  });
  
  // 5. Resolution time (for performance tracking)
  issueSchema.virtual('resolutionTimeInDays').get(function() {
    if (this.closedAt && this.createdAt) {
      return Math.floor((this.closedAt - this.createdAt) / (1000 * 60 * 60 * 24));
    }
    return null;
  });
  
  // 6. Check if issue is stale
  issueSchema.methods.isStale = function(days = 30) {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - days);
    return this.updatedAt < staleDate && this.state === 'open';
  };
  
  // Include virtuals in JSON output
  issueSchema.set('toJSON', { virtuals: true });
  
  export const Issue = mongoose.model('Issue', issueSchema);