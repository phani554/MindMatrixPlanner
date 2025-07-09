import mongoose from "mongoose";
import { Employee } from "./models/employees.model.js";

const employeesToUpdate = [
    {
      "name": "Meghana Thakekar",
      "username": "MeghanaThakekar",
      "githubId": 6465588
    },
    {
      "name": "Vishal Patil",
      "username": "Vish-Patil",
      "githubId": 6465635
    },
    {
      "name": "Pushpendra Pandey",
      "username": "pushpendraPande",
      "githubId": 84513539
    },
    {
      "name": "Philip Kanth",
      "username": "pKanth",
      "githubId": 6465584
    },
    {
      "name": "Shiv Mishra",
      "username": "shivmishra",
      "githubId": 6465643
    },
    {
      "name": "Yogesh Gharat",
      "username": "yogeshgharat",
      "githubId": 6941481
    },
    {
      "name": "Mahima Patil",
      "username": "Mahimapatil",
      "githubId": 13726617
    },
    {
      "name": "Tajinder Sharma",
      "username": "tajindersharma",
      "githubId": 42926529
    },
    {
      "name": "Furquan Khan",
      "username": "furquankhan",
      "githubId": 6465608
    },
    {
      "name": "Rahul Jogdand",
      "username": "Rahulmaxv",
      "githubId": 20436878
    },
    {
      "name": "Tamanna Rana",
      "username": "tamannarevclerx",
      "githubId": 88433216
    },
    {
      "name": "Sumit Kumar Mittal",
      "username": "sumitrevclerx",
      "githubId": 58559444
    },
    {
      "name": "Haresh Kedar",
      "username": "HareshKedar",
      "githubId": 6492820
    },
    {
      "name": "Vinayak Suryavanshi",
      "username": "Vinayakvs1994",
      "githubId": 79090746
    },
    {
      "name": "Priyanka Borunde",
      "username": "PriyankaBorunde",
      "githubId": 22660369
    },
    {
      "name": "Abdur Rauf",
      "username": "AbdurRauf-Khan",
      "githubId": 87379623
    },
    {
      "name": "Abhijit Nair",
      "username": "AbhijithNa1r",
      "githubId": 170502556
    },
    {
      "name": "Abhineet Kumar",
      "username": "abhineetkumar49",
      "githubId": 109676892
    },
    {
      "name": "Abhishek Saiswani",
      "username": "abhisheksaiswani",
      "githubId": 6465580
    },
    {
      "name": "Abhishek Ugale",
      "username": "abhishek-ugale12",
      "githubId": 180923893
    },
    {
      "name": "Achal Kumar",
      "username": "AchalRevclerx",
      "githubId": 181352727
    },
    {
      "name": "Ajitpal Singh",
      "username": "ajitSMalhi",
      "githubId": 150783001
    },
    {
      "name": "Akanksha Sharma",
      "username": "Akanksha2321",
      "githubId": 170304379
    },
    {
      "name": "Amit Ahuja",
      "username": "amitahujarev",
      "githubId": 126570200
    },
    {
      "name": "Amritpal Singh",
      "username": "amritpal0001",
      "githubId": 169251980
    },
    {
      "name": "Amruta Kamble",
      "username": "AmrutaKamble10",
      "githubId": 115165149
    },
    {
      "name": "Aniket Kumar",
      "username": "AniketRevclerx",
      "githubId": 181114940
    },
    {
      "name": "Anju Vishwakarma",
      "username": "AnjuRV",
      "githubId": 88433214
    },
    {
      "name": "Ashif Husain",
      "username": "ashifhusainoo7",
      "githubId": 109672524
    },
    {
      "name": "Ashutosh Pandey",
      "username": "Ashu-990",
      "githubId": 137782841
    },
    {
      "name": "Chinna Kotareddy",
      "username": "ChinnaMaxval",
      "githubId": 117972166
    },
    {
      "name": "Cnigdha Soares",
      "username": "Cnigdha",
      "githubId": 152146521
    },
    {
      "name": "Dikshita Kasare",
      "username": "Dikshitakasare0108",
      "githubId": 137781971
    },
    {
      "name": "R Dilleswar Rao",
      "username": "dilleswarrevclerx",
      "githubId": 50979631
    },
    {
      "name": "Dilpreet Kaur",
      "username": "dilpreetkaurrevclerx",
      "githubId": 104075619
    },
    {
      "name": "Divyesh Hole",
      "username": "DivyeshHole",
      "githubId": 112927107
    },
    {
      "name": "Gurinder Singh",
      "username": "gurinder1497",
      "githubId": 92525920
    },
    {
      "name": "Harikumar Reddy",
      "username": "lathareddys",
      "githubId": 147129454
    },
    {
      "name": "Jaskarn Singh",
      "username": "JaskarnSingh1992",
      "githubId": 151126742
    },
    {
      "name": "Jay Barot",
      "username": "JayBarot10",
      "githubId": 137781327
    },
    {
      "name": "Zaid Kadri",
      "username": "ZaidKadiri",
      "githubId": 115164811
    },
    {
      "name": "Komal Chawla",
      "username": "komalchawlarevclerx",
      "githubId": 113579435
    },
    {
      "name": "Kriti Shetty",
      "username": "KritiShetty",
      "githubId": 137781165
    },
    {
      "name": "Kumar Chandan",
      "username": "chandanrevclerx",
      "githubId": 121863662
    },
    {
      "name": "Kunal Wavhule",
      "username": "kunalmindmatrix",
      "githubId": 118966210
    },
    {
      "name": "Laxmikant Yadav",
      "username": "Laxmikant-Yadav",
      "githubId": 137782443
    },
    {
      "name": "Lidiya Dominic",
      "username": "Lidiya0402",
      "githubId": 87377156
    },
    {
      "name": "Manali Patil",
      "username": "manali1109",
      "githubId": 105647044
    },
    {
      "name": "Manoj Sharma",
      "username": "manoj-rev",
      "githubId": 148982084
    },
    {
      "name": "Mayur Patil",
      "username": "mayurpa22",
      "githubId": 105477460
    },
    {
      "name": "Mohammed Hammad",
      "username": "MohammedHammad01",
      "githubId": 150241558
    },
    {
      "name": "Mohammed Saeed",
      "username": "SaeedMS22",
      "githubId": 115165743
    },
    {
      "name": "Mohammed Ubaid",
      "username": "ubaidmohammed",
      "githubId": 6465628
    },
    {
      "name": "Muwaj Mulla",
      "username": "muwaj-mulla",
      "githubId": 137782397
    },
    {
      "name": "Noor Ansari",
      "username": "Noor-1898",
      "githubId": 99163263
    },
    {
      "name": "Parvesh Sharma",
      "username": "SharmaParvesh",
      "githubId": 118245398
    },
    {
      "name": "Payal Thakur",
      "username": "PayalRevclerx",
      "githubId": 180507438
    },
    {
      "name": "Pooja Ghope",
      "username": "poojaghope",
      "githubId": 105706651
    },
    {
      "name": "Prachi Bansode",
      "username": "bansodeprachi",
      "githubId": 105647312
    },
    {
      "name": "Prashant Ghule",
      "username": "pghule82",
      "githubId": 109220027
    },
    {
      "name": "Pratik Bhagit",
      "username": "pratikbhagit",
      "githubId": 112927176
    },
    {
      "name": "Priya Badyal",
      "username": "PriyaBadyal",
      "githubId": 103936597
    },
    {
      "name": "Rohin Sharma",
      "username": "rohin2sharmarevclerx",
      "githubId": 92525805
    },
    {
      "name": "Rohit Gupta",
      "username": "rohitrevclerx",
      "githubId": 121864967
    },
    {
      "name": "Saba Shaikh",
      "username": "Saba-Sk",
      "githubId": 150647726
    },
    {
      "name": "Sabharee Raj",
      "username": "sabhareeraj",
      "githubId": 98084240
    },
    {
      "name": "Sakshi Phalke",
      "username": "sakshii3006",
      "githubId": 150653428
    },
    {
      "name": "Salmaan Ali",
      "username": "SalmaanAli",
      "githubId": 71872682
    },
    {
      "name": "Sarbjit Raju",
      "username": "Sarbjit-raju",
      "githubId": 158447729
    },
    {
      "name": "Saurab Kumar",
      "username": "saurabrevclerx",
      "githubId": 121862721
    },
    {
      "name": "Sayak Mitra",
      "username": "sayak0006",
      "githubId": 32535526
    },
    {
      "name": "Shailesh Tayde",
      "username": "shaileshtayde",
      "githubId": 6465652
    },
    {
      "name": "Shakeb Anwar",
      "username": "shakebanwar",
      "githubId": 97658581
    },
    {
      "name": "Shubham Tyagi",
      "username": "ShubhamTyagiRevclerx",
      "githubId": 170304343
    },
    {
      "name": "Shubhangi Jadhav",
      "username": "shubhangijadhav1212",
      "githubId": 170521971
    },
    {
      "name": "Shubhankar Sharma",
      "username": "ShubhankarRevclerx",
      "githubId": 181352616
    },
    {
      "name": "Srushti Sakharkar",
      "username": "Srushti225",
      "githubId": 105647357
    },
    {
      "name": "Sunil Kumar",
      "username": "sunil768",
      "githubId": 71871374
    },
    {
      "name": "Tushar Gupta",
      "username": "Tushargupta3012",
      "githubId": 150241912
    },
    {
      "name": "Umed Gunjal",
      "username": "ugunjal",
      "githubId": 105647075
    },
    {
      "name": "Varsha Golimmbide",
      "username": "vgolimbade",
      "githubId": 105647924
    },
    {
      "name": "Vinesh Desham",
      "username": "vineshvinnu",
      "githubId": 14013971
    },
    {
      "name": "Wasim Khan",
      "username": "WasimKhan01",
      "githubId": 150241570
    },
    {
      "name": "Wasima Shaikh",
      "username": "WasimaShaikh",
      "githubId": 170519534
    },
    {
      "name": "Yasin Shaikh",
      "username": "yasinshaikh111",
      "githubId": 169248530
    },
    {
      "name": "Yogendra matkar",
      "username": "YogendraMatkar",
      "githubId": 106380597
    },
    {
      "name": "Nagarani Dubbaka",
      "username": null,
      "githubId": 42613052
    },
    {
      "name": "Vardharaj Kawde",
      "username": null,
      "githubId": 6553864
    },
    {
      "name": "Manjiri Desmukh",
      "username": null,
      "githubId": 54529079
    },
    {
      "name": "Parveen Kumar",
      "username": null,
      "githubId": 69450747
    },
    {
      "name": "Lovish Bhatti",
      "username": null,
      "githubId": 50917627
    },
    {
      "name": "Amandeep Kaur",
      "username": null,
      "githubId": 192942211
    },
    {
      "name": "Amitabh Talukdar",
      "username": null,
      "githubId": 27962160
    },
    {
      "name": "Roma Soni",
      "username": null,
      "githubId": 54528766
    },
    {
      "name": "Rohit Haridas",
      "username": null,
      "githubId": 6639166
    },
    {
      "name": "Vidya Bade",
      "username": null,
      "githubId": 45587887
    },
    {
      "name": "Abhay Gaikwad",
      "username": null,
      "githubId": 192886068
    },
    {
      "name": "Abhishek Kumar",
      "username": null,
      "githubId": 143691781
    },
    {
      "name": "Aditi Thakur",
      "username": null,
      "githubId": 90826779
    },
    {
      "name": "Akash Kumar",
      "username": null,
      "githubId": 187263927
    },
    {
      "name": "Anandit Sood",
      "username": null,
      "githubId": 187247969
    },
    {
      "name": "Ankit Kumar",
      "username": null,
      "githubId": 147475845
    },
    {
      "name": "Anuj Singh",
      "username": null,
      "githubId": 97150054
    },
    {
      "name": "Asher Kumar",
      "username": null,
      "githubId": 103925765
    },
    {
      "name": "Atul Sharma",
      "username": null,
      "githubId": 182089090
    },
    {
      "name": "Bhagyashri Wankhade",
      "username": null,
      "githubId": 125253397
    },
    {
      "name": "Deeksha Sharma",
      "username": null,
      "githubId": 102713290
    },
    {
      "name": "Dheeraj Sobti",
      "username": null,
      "githubId": 141320879
    },
    {
      "name": "Eshwar Chavan",
      "username": null,
      "githubId": 143786706
    },
    {
      "name": "Gudia",
      "username": null,
      "githubId": 178142274
    },
    {
      "name": "Hritikesh Kumar",
      "username": null,
      "githubId": 175302554
    },
    {
      "name": "Imteyaz Ahamad",
      "username": null,
      "githubId": 119917459
    },
    {
      "name": "Jasdeep Kaur",
      "username": null,
      "githubId": 178136056
    },
    {
      "name": "Kanchan Singh",
      "username": null,
      "githubId": 147475567
    },
    {
      "name": "Krishnakant Dubey",
      "username": null,
      "githubId": 136305060
    },
    {
      "name": "Manish Kumar",
      "username": null,
      "githubId": 110168840
    },
    {
      "name": "Meenakshi",
      "username": null,
      "githubId": 191082149
    },
    {
      "name": "Megha Solanke",
      "username": null,
      "githubId": 106654008
    },
    {
      "name": "Anusha Miryala",
      "username": null,
      "githubId": 105437575
    },
    {
      "name": "Mitali Thakur",
      "username": null,
      "githubId": 110168980
    },
    {
      "name": "Mohit Makhaik",
      "username": null,
      "githubId": 130961207
    },
    {
      "name": "Natasha Kapoor",
      "username": null,
      "githubId": 163122977
    },
    {
      "name": "Navdeep Singh",
      "username": null,
      "githubId": 97150227
    },
    {
      "name": "Nikhil Rai",
      "username": null,
      "githubId": 191978509
    },
    {
      "name": "Nikhil Sidana",
      "username": null,
      "githubId": 182471708
    },
    {
      "name": "Nishtha Aneja",
      "username": null,
      "githubId": 178136025
    },
    {
      "name": "Pankaj Bhardwaj",
      "username": null,
      "githubId": 184734281
    },
    {
      "name": "Pooja Upreti",
      "username": null,
      "githubId": 164486103
    },
    {
      "name": "Prerna Sharma",
      "username": null,
      "githubId": 126458596
    },
    {
      "name": "Priyank Kumar",
      "username": null,
      "githubId": 110168689
    },
    {
      "name": "Sahil Thakur",
      "username": null,
      "githubId": 152860609
    },
    {
      "name": "Sukreeti Sharma",
      "username": null,
      "githubId": 180617195
    },
    {
      "name": "Tarun jamwal",
      "username": null,
      "githubId": 167079321
    },
    {
      "name": "Tarun Mittal",
      "username": null,
      "githubId": 125947484
    },
    {
      "name": "Varaprasad Rao",
      "username": null,
      "githubId": 13694943
    },
    {
      "name": "Viraj Madhavi",
      "username": null,
      "githubId": 193463800
    },
    {
      "name": "Yash Jain",
      "username": null,
      "githubId": 123166452
    },
    {
        "name": "Ashwani Kumar",
        "username": "Ashwani-revclerx",
        "githubId": 91262914
    },
    {
        "name": "Ali Imam",
        "username": "AliImam02",
        "githubId": 185221571
    },
    {
        "name": "Sanika shinde",
        "username": "sanikashinde628",
        "githubId": 207057962
    },
    {
        "name": "Wasi Mohammad",
        "username": "MohddWasi2",
        "githubId": 208835863
    },
    {
        "name": "Neha Sawant",
        "username": "NehaSawant2306",
        "githubId": 207058071
    },
    {
        "name": "Eva Chaudhary",
        "username": "Evakangra",
        "githubId": 138590209
    },
    {
        "name": "Amit Sharma",
        "username": "amitrevclerx",
        "githubId": 187360307
    },
    {
        "name": "Ashwani Kumar",
        "username": "Ashwani-revclerx",
        "githubId": 91262914
    },
    {
        "name": "Abhay Mohnot",
        "username": "apmohnot"
    },
    {
        "name": "Aman Deep",
        "username": "amandeeprevclerx"
    }
];

async function runEnrichmentWithUpsert() {
    // We add a new counter for inserted records
    let updatedCount = 0;
    let insertedCount = 0; // NEW
    let notFoundCount = 0; // This will now likely remain 0, but we keep it for clarity
    let duplicateCount = 0;

    try {
        console.log("Connecting to the database...");
        // Use your environment variable or a hardcoded string
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/github-dashboard';
        await mongoose.connect(mongoURI);
        console.log("Database connected successfully.\n");

        // Iterate over each employee in the enrichment data
        for (const employeeData of employeesToUpdate) {
            const { name, githubId, username } = employeeData;

            try {
                // Find documents in the DB matching the name to check for duplicates first
                const foundEmployees = await Employee.find({ name: name });

                // CASE 1: Exactly one employee found - The ideal case for an UPDATE
                if (foundEmployees.length === 1) {
                    const employeeToUpdate = foundEmployees[0];
                    await Employee.updateOne(
                        { _id: employeeToUpdate._id },
                        // Use $set to avoid overwriting the entire document
                        { $set: { githubId: githubId, username: username } }
                    );
                    updatedCount++;
                    console.log(`🔄 Updated: '${name}' with GitHub ID: ${githubId}`);
                }
                // CASE 2: No employee found - The ideal case for an INSERT
                else if (foundEmployees.length === 0) {
                    await Employee.create(employeeData); // Create a new document
                    insertedCount++; // Increment the new counter
                    console.log(`✅ Inserted: '${name}' as a new employee record.`);
                }
                // CASE 3: Duplicate names found - A critical issue, SKIP this record
                else {
                    duplicateCount++;
                    console.warn(`⚠️  Duplicate Found: ${foundEmployees.length} employees found with the name '${name}'. No action was performed to ensure data integrity.`);
                }
            } catch (err) {
                // Handle potential unique constraint errors (e.g., githubId already exists)
                if (err.code === 11000) {
                    console.error(`🔒 Error: The GitHub ID '${githubId}' for user '${name}' already exists in the database on another record.`);
                } else {
                    console.error(`An unexpected error occurred for user '${name}':`, err);
                }
            }
        }

    } catch (error) {
        console.error("A critical error occurred during the process:", error);
    } finally {
        // Print a summary and disconnect
        console.log("\n--- Upsert Summary ---");
        console.log(`✅ ${insertedCount} employee(s) were newly inserted.`);
        console.log(`🔄 ${updatedCount} employee(s) were successfully updated.`);
        console.log(`⚠️  ${duplicateCount} name(s) had duplicates in the database and were skipped.`);
        console.log("------------------------");
        await mongoose.disconnect();
        console.log("Database connection closed.");
    }
}
  
  // Run the main function
runEnrichmentWithUpsert();