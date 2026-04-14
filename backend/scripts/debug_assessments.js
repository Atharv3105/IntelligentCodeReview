const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });
const Assessment = require("../models/Assessment");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const assessments = await Assessment.find({});
  console.log(JSON.stringify(assessments, null, 2));
  process.exit(0);
}

run();
