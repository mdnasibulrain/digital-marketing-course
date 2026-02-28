const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname,"../frontend")));

const DATA_FILE = './transactions.json';
const FULL_AMOUNT = 299;

// ---------- helpers ----------
function readTransactions(){
if(!fs.existsSync(DATA_FILE)) return [];
return JSON.parse(fs.readFileSync(DATA_FILE,'utf8') || '[]');
}

function writeTransactions(data){
fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));
}

// ---------- submit ----------
app.post('/submit-payment',(req,res)=>{
const {email, txn, paidAmount, method} = req.body;

if(!email || !txn || !paidAmount || paidAmount < FULL_AMOUNT){
return res.status(400).send({message:"Invalid or insufficient payment"});
}

const transactions = readTransactions();

if(transactions.find(t=>t.txn===txn)){
return res.status(400).send({message:"Transaction already exists"});
}

transactions.push({
email,
txn,
paidAmount,
method,
status:'pending'
});

writeTransactions(transactions);

res.send({message:"Payment submitted"});
});

// ---------- verify ----------
app.post('/verify-payment',(req,res)=>{
const {txn} = req.body;

const transactions = readTransactions();
const tx = transactions.find(t=>t.txn===txn);

if(!tx) return res.status(404).send({message:"Transaction not found"});

tx.status="verified";

writeTransactions(transactions);

res.send({message:"Verified"});
});

// ---------- check ----------
app.get('/check/:txn',(req,res)=>{
const transactions = readTransactions();
const tx = transactions.find(t=>t.txn===req.params.txn);
res.send({verified: tx && tx.status==="verified"});
});

// ---------- ADMIN LIST ROUTE (IMPORTANT) ----------
app.get('/transactions',(req,res)=>{
const transactions = readTransactions();
res.send(transactions);
});

// ---------- start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("Server running on port "+PORT));
