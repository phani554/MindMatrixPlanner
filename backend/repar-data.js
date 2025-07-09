import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Employee } from './models/employees.model.js';

dotenv.config();

const explicitTeamLeads = new Set([
  'Vishal Patil', 'Vinayak Suryavanshi', 'Sumit Kumar Mittal', 'Shiv Mishra', 'Mahima Patil',
  'Tajinder Sharma', 'Furquan Khan', 'Tamanna Rana', 'Yogesh Gharat', 'Haresh Kedar',
  'Rahul Jogdand', 'Philip Kanth', 'Pushpendra Pandey', 'Abhay Mohnot', 'Meghana Thakekar',
  'Sayak Mitra', 'Priyanka Borunde', 'Vinesh Desham', 'Jatinder Singh',
  'Vardharaj Kawde', 'Manjiri Deshmukh', 'Parveen Kumar', 'Lovish Bhatti', 'Sageer Shaikh',
  'Amandeep Kaur', 'Sunil Rao', 'Amitabh Talukdar', 'Roma Soni', 'Nagarani Dubbaka',
  'Rohit Haridas', 'Vidya Bade'
]);

const explicitModuleOwners = new Set([
  'Furquan Khan', 'Haresh Kedar', 'Mahima Patil', 'Meghana Thakekar', 'Mohammed Ubaid',
  'Philip Kanth', 'Pushpendra Pandey', 'Rahul Jogdand', 'Shailesh Tayde', 'Shiv Mishra',
  'Tajinder Sharma', 'Vishal Patil', 'Yogesh Gharat',
  'Sunil Rao', 'Nagarani Dubbaka'
]);

async function verifyRoles() {
  console.log('--- Starting Data Verification Script ---');
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  console.log('✅ Database connected.\n');

  const allEmployees = await Employee.find();

  // Update all records with correct role flags
  const nameToIdMap = new Map();
  for (const emp of allEmployees) {
    nameToIdMap.set(emp.name, emp._id.toString());
    const isLead = explicitTeamLeads.has(emp.name);
    const isOwner = explicitModuleOwners.has(emp.name);
    await Employee.findByIdAndUpdate(emp._id, {
      isTeamLead: isLead,
      isModuleOwner: isOwner
    });
  }

  // Step 1: Dereference any reportsTo pointing to non-leads
  const validLeadIds = new Set();
  for (const emp of allEmployees) {
    if (explicitTeamLeads.has(emp.name)) {
      validLeadIds.add(emp._id.toString());
    }
  }

  const toNullify = await Employee.find({ reportsTo: { $ne: null } });
  for (const emp of toNullify) {
    const refId = emp.reportsTo?.toString();
    if (!validLeadIds.has(refId)) {
      await Employee.findByIdAndUpdate(emp._id, { reportsTo: null });
    }
  }

  // Step 2: Accumulate team modules and append to each lead's module list
  const updatedEmployees = await Employee.find();
  const leadModules = new Map();

  for (const emp of updatedEmployees) {
    if (emp.reportsTo && validLeadIds.has(emp.reportsTo.toString())) {
      const mgrId = emp.reportsTo.toString();
      const modList = leadModules.get(mgrId) || new Set();
      for (const mod of emp.modules) {
        modList.add(mod);
      }
      leadModules.set(mgrId, modList);
    }
  }

  for (const [mgrId, modSet] of leadModules.entries()) {
    const mgr = await Employee.findById(mgrId);
    const combinedModules = new Set([...(mgr.modules || []), ...modSet]);
    await Employee.findByIdAndUpdate(mgrId, { modules: Array.from(combinedModules) });
  }

  const moduleOwners = await Employee.find({ isModuleOwner: true });
  const teamLeads = await Employee.find({ isTeamLead: true });

  console.log('\n==================== ALL MODULE OWNERS ====================\n');
  console.table(moduleOwners.map(e => ({ Name: e.name, Modules: e.modules.join(', ') })));

  console.log('\n==================== ALL TEAM LEADS AND THEIR TEAM SIZE ====================\n');
  const reports = await Employee.aggregate([
    { $match: { reportsTo: { $ne: null } } },
    { $group: { _id: '$reportsTo', count: { $sum: 1 } } }
  ]);
  const idToCount = Object.fromEntries(reports.map(r => [r._id.toString(), r.count]));

  const leadStats = teamLeads.map(e => ({
    'Team Lead': e.name,
    'Overseen Modules': e.modules.length,
    'Direct Reports': idToCount[e._id.toString()] || 0
  }));
  console.table(leadStats);

  const strayLeads = teamLeads.filter(e => !explicitTeamLeads.has(e.name));
  const strayOwners = moduleOwners.filter(e => !explicitModuleOwners.has(e.name));

  if (strayLeads.length > 0 || strayOwners.length > 0) {
    console.warn('\n⚠️  Unexpected flags found:');
    if (strayLeads.length > 0) {
      console.warn('Team leads not in list:', strayLeads.map(e => e.name));
    }
    if (strayOwners.length > 0) {
      console.warn('Module owners not in list:', strayOwners.map(e => e.name));
    }
  } else {
    console.log('\n✅ All flags match explicit lists.');
  }

  await mongoose.disconnect();
  console.log('\nDatabase disconnected.');
}

verifyRoles().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
