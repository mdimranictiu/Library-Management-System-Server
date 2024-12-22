require('dotenv').config()
const express = require('express');
const port= process.env.PORT || 5000;
const app= express()

app.get('/',(req,res)=>{
    res.send('Hello World')
})




app.listen(port,(req,res)=>{
console.log(`server is running at http://localhost:${port}`);
})
