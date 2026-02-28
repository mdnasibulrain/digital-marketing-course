const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('../frontend')); // serve frontend files

const DATA_FILE = './transactions.json';
const FULL_AMOUNT = 299;

// Helper to read/write JSON file
function readTransactions() {
    return JSON.parse(fs.readFileSync(DATA_FILE,'utf8') || '[]');
}
function writeTransactions(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data,null,2));
}

// Submit payment
app.post('/submit-payment', (req,res)=>{
    const {email, txn, paidAmount, method} = req.body;
    if(!email || !txn || !paidAmount || paidAmount<FULL_AMOUNT){
        return res.status(400).send({message:"Invalid submission or amount less than 299"});
    }
    const transactions = readTransactions();
    if(transactions.find(t=>t.txn===txn)){
        return res.status(400).send({message:"Transaction ID already submitted"});
    }
    transactions.push({email, txn, paidAmount, method, status:'pending'});
    writeTransactions(transactions);
    res.send({message:"Submitted successfully"});
});

// Verify payment (admin only)
app.post('/verify-payment', (req,res)=>{
    const {txn} = req.body;
    const transactions = readTransactions();
    const tx = transactions.find(t=>t.txn===txn);
    if(!tx) return res.status(404).send({message:"Transaction not found"});
    tx.status='verified';
    writeTransactions(transactions);
    res.send({message:"Verified successfully"});
});

// Check verification status
app.get('/check/:txn',(req,res)=>{
    const transactions = readTransactions();
    const tx = transactions.find(t=>t.txn===req.params.txn);
    res.send({verified: tx && tx.status==='verified'});
});

app.listen(3000,()=>console.log('Backend running on http://localhost:3000'));