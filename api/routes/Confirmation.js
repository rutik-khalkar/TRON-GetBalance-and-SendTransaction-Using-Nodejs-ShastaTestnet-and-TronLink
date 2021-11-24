const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken');
const config = process.env;
const TronWeb = require('tronweb');

const HttpProvider = TronWeb.providers.HttpProvider;

const fullNode = new HttpProvider(process.env.HOST)

const solidityNode = new HttpProvider(process.env.HOST)

const eventServer = process.env.HOST;

const privateKey = process.env.privateKey;

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

const mail = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:process.env.USER,
        pass:process.env.PASSWORD    
    }
});


let mailOptions, host, link;
router.post('/confirm', async (req, res, next) => {
    try {
        const { email, from, to , amount, name} = req.body;
        if (!(email && from && to && amount, name)){
            res.status(400).send('All input field is requried!');
        }else{
            const em = email.match( /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
            if(!(em)){
                res.send('Invalid Email')
            }else {

                const transaction = new Transaction({
                    _id : new mongoose.Types.ObjectId,
                    email : email,
                    name : name,
                    from : from,
                    to : to,
                    amount : amount,
                })

                //========================//
                host = req.get('host');
                link = jwt.sign(
                    {
                        transaction    
                    },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "1h",
                    }
                )                
                token = 'http://' + req.get('host') + '/api/verify?link='+link;

                failed = 'http://' + req.get('host') + '/api/decline?link='+link;
               
                res.send("Please check your mail for Tron transaction confirmation!")
                
                mailOptions = {
                    from: process.env.USER,
                    to: email,
                    subject: `Please confirm your TRON transaction`,
                    html : `<div class="container" style="margin: 30px;">
                            <a href=${token} 
                            style="
                                background-color: #1a73e8;
                                padding: 10px;
                                margin: 10px;
                                color: white;
                                font-family: sans-serif;
                                text-decoration: none;
                                font-weight: 500;
                            ">
                            Click Here To Confirm Your TRON Transaction</a>
                            <br><br><br><br>
                            <a href=${failed} 
                            style="
                                background-color: #d93025;
                                padding: 10px;
                                margin: 10px;
                                color: white;
                                font-family: sans-serif;
                                text-decoration: none;
                                font-weight: 500;
                            ">
                            Decline This Transaction</a>
                        </div>`
                };
                 
                mail.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    }
                    else{
                        console.log('Email sent: ' + info.response);
                        // res.send('Email sent: ' + info.response);
                    }
                });
            }
        }
    } catch (error) {
        res.send(error)
    }
})



router.get('/verify', async (req, res, next) => {
    if((req.protocol+"://"+req.get('host'))==("http://"+host)){
        if(req.query.link==link){
            const decode = jwt.verify(link, config.TOKEN_KEY);
            
            
            // const newID = await Transaction.findOne( {_id : decode.transaction._id} );

            if(await Transaction.findOne({_id : decode.transaction._id} )){
                res.send('<b>This transaction is decline by user</b>')
            } else {
                const tradeobj = await tronWeb.transactionBuilder.sendTrx(decode.transaction.to, decode.transaction.amount, decode.transaction.from);
                const signedtxn = await tronWeb.trx.sign(tradeobj);
                const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);
    
                const transaction = new Transaction({
                    _id : decode.transaction._id,
                    name : decode.transaction.name,
                    email :decode.transaction.email,
                    from :decode.transaction.from,
                    to : decode.transaction.to,
                    amount : decode.transaction.amount,
                    txID: receipt.txid,
                    status : true
                });
    
                mailOptions = {
                    from: process.env.USER,
                    to: decode.transaction.email,
                    subject: `Your TRON Transaction success!`,
                    html: `<!doctype html>
                            <html lang="en">
                              <head>
                                <!-- Bootstrap CSS -->
                                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" integrity="sha384-zCbKRCUGaJDkqS1kPbPd7TveP5iyJE0EjAuZQTgFLD2ylzuqKfdKlfG/eSrtxUkn" crossorigin="anonymous">
                                <title>Hello, world!</title>
                                <style>
                                    .container{
                                        margin-top: 3%;
                                        /* text-align: center; */
                                        border-radius: 10px;
                                        border: 3px solid #FF0028;
                                        padding: 10px;
                                        position: fixed;
                                        top: 0;
                                        right: 0;
                                        left: 0;
                                        /* height: 46px; */
                                        z-index: 100;
                                    }
                                    .header{
                                        display: flex;
                                        margin-right: 20px;
                                        margin-left: 20px;
                                    }
                                    h1{
                                        display: inline;
                                    }
                                    h4{
                                        display: inline;
                                        float:right;
                                        font-weight: 400;
                                        font-size: 20px;
                                        margin-top: 25px;
                                    }
                                    .main{
                                        /* display: flexbox; */
                                        background-color: #f7f9fa;
                                        padding: 10px;
                                        margin-top: 30px;
                                    }
                                    table{
                                        margin-top: 20px;
                                    }
                                </style>
                              </head>
                              <body>
                                <div class="container">
                                   <header>
                                       <img src="https://s2.coinmarketcap.com/static/img/coins/200x200/1958.png" alt="Ethereum logo" height="70" width="70">
                                       <h4>${Date()}</h4>
                                   </header>
                                   <div class="container-fluid">
                                       <div class="main">
                                            <b>Your Tron Transaction success!</b>
                                            <table class="table">
                                                <tr>
                                                    <td>Tnx. ID </td>
                                                    <td>: &nbsp;${transaction._id}</td>
                                                </tr>
                                                <tr>
                                                    <td>Tnx. Status </td>
                                                    <td style="color: #3c3c3d;">: &nbsp; Successful</td>
                                                </tr>
                                                <tr>
                                                    <td>Sender Address </td>
                                                    <td>: &nbsp; ${transaction.from}</td>
                                                </tr>
                                                <tr>
                                                    <td>Receiver Address </td>
                                                    <td>: &nbsp; ${transaction.to}</td>
                                                </tr>
                                                <tr>
                                                    <td>Amount </td>
                                                    <td>: &nbsp; ${transaction.amount}</td>
                                                </tr> 
                                                <tr>
                                                    <td>Tnx.Hash </td>
                                                    <td>: &nbsp; https://shasta.tronscan.org/#/transaction/${transaction.txID}</td>
                                                </tr> 
                                            </table>
                                       </div>
                                       <div class="wrapper">
                                           <p>Hi ${transaction.name}</p>
                                           <p>If you have not made this transaction or notice any error please contact us at <a href=" https://support.rutikkhalkar.com"> https://support.rutikkhalkar.com</a> </p>
                                           <p>Cheers! <br>
                                            Team Tron
                                           </p>
                                       </div>
                                   </div>
                                </div>
                            
                            
                                <!-- Option 1: jQuery and Bootstrap Bundle (includes Popper) -->
                                <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
                                <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-fQybjgWLrvvRgtW6bFlB7jaZrFsaBXjsOMm/tB9LTS58ONXgqbR9W8oWht/amnpF" crossorigin="anonymous"></script>
                            
                              </body>
                            </html>`
                };
                 
                mail.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    }
                    else{
                        console.log('Email sent: ' + info.response);
                        console.log('Tnx.ID: ' + transaction.txID);
                    }
                });
    
                try {
                    const t1 = await transaction.save()
                    res.status(200).json({
                        Message : 'Transaction confirm! Please Check Your Mail!',
                        t1
                    }) 
                } catch (error) {
                    res.status(404).json({
                        Message :'Unable to save transaction :',
                        error
                    })
                } 
            }
        }
        else{
            res.send('not match')
        }
    }
    // else {
    //     res.send('Link expired!')
    // }
});


router.get('/decline', async (req, res, next) => {
    if((req.protocol+"://"+req.get('host'))==("http://"+host)){
        if(req.query.link==link){
            const decode = jwt.verify(link, config.TOKEN_KEY);
            
             // const newID = await Transaction.findOne({_id : decode.transaction._id} );

             if(await Transaction.findOne({_id : decode.transaction._id} )){
                res.send('This transaction is success by user!')
            } else {
                let t = new Transaction({
                    _id :decode.transaction._id,
                    name : decode.transaction.name,
                    email : decode.transaction.email,
                    from :decode.transaction.from,
                    to : decode.transaction.to,
                    amount : decode.transaction.amount,
                    status : false
                });

                mailOptions = {
                    from: process.env.USER,
                    to: decode.transaction.email,
                    subject: `The TRON Transaction decline!`,
                    html: `<!doctype html>
                        <html lang="en">
                          <head>
                            <!-- Bootstrap CSS -->
                            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/css/bootstrap.min.css" integrity="sha384-zCbKRCUGaJDkqS1kPbPd7TveP5iyJE0EjAuZQTgFLD2ylzuqKfdKlfG/eSrtxUkn" crossorigin="anonymous">
                            <title>Hello, world!</title>
                            <style>
                                .container{
                                    margin-top: 3%;
                                    /* text-align: center; */
                                    border-radius: 10px;
                                    border: 3px solid #3c3c3d;
                                    padding: 10px;
                                    position: fixed;
                                    top: 0;
                                    right: 0;
                                    left: 0;
                                    /* height: 46px; */
                                    z-index: 100;
                                }
                                .header{
                                    display: flex;
                                    margin-right: 20px;
                                    margin-left: 20px;
                                }
                                h1{
                                    display: inline;
                                }
                                h4{
                                    display: inline;
                                    float:right;
                                    font-weight: 400;
                                    font-size: 20px;
                                    margin-top: 25px;
                                }
                                .main{
                                    /* display: flexbox; */
                                    background-color: #f7f9fa;
                                    padding: 10px;
                                    margin-top: 30px;
                                }
                                table{
                                    margin-top: 20px;
                                }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                               <header>
                                   <img src="https://s2.coinmarketcap.com/static/img/coins/200x200/1958.png" alt="TRON logo" height="70" width="70">
                                   <h4>${Date()}</h4>
                               </header>
                               <div class="container-fluid">
                                   <div class="main">
                                        <b>Your TRON Transaction is decline!</b>
                                        <table class="table">
                                            <tr>
                                                <td>Tnx. ID </td>
                                                <td>: &nbsp;${t._id}</td>
                                            </tr>
                                            <tr>
                                                <td>Tnx. Status </td>
                                                <td style="color: #ea4335;">: &nbsp; failed!</td>
                                            </tr>
                                            <tr>
                                                <td>Sender Address </td>
                                                <td>: &nbsp; ${t.from}</td>
                                            </tr>
                                            <tr>
                                                <td>Receiver Address </td>
                                                <td>: &nbsp; ${t.to}</td>
                                            </tr>
                                            <tr>
                                                <td>Amount </td>
                                                <td>: &nbsp; ${t.amount}</td>
                                            </tr> 
                                        </table>
                                   </div>
                                   <div class="wrapper">
                                       <p>Hi ${t.name}</p>
                                       <p>If you have not made this transaction or notice any error please contact us at <a href=" https://support.rutikkhalkar.com"> https://support.rutikkhalkar.com</a> </p>
                                       <p>Cheers! <br>
                                        Team Ethereum
                                       </p>
                                   </div>
                               </div>
                            </div>
                        
                        
                            <!-- Option 1: jQuery and Bootstrap Bundle (includes Popper) -->
                            <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js" integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj" crossorigin="anonymous"></script>
                            <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-fQybjgWLrvvRgtW6bFlB7jaZrFsaBXjsOMm/tB9LTS58ONXgqbR9W8oWht/amnpF" crossorigin="anonymous"></script>
                        
                          </body>
                        </html>`
                };
                 
                mail.sendMail(mailOptions, function(error, info){
                    if (error) {
                        console.log(error);
                    }
                    else{
                        console.log('Email sent: ' + info.response);
                        res.send('Email sent: ' + info.response);
                    }
                });

                try {
                    const t1 = await t.save()
                    res.status(200).json({
                        Message : 'Transaction decline by user...',
                        t1,
                    }) 
                }
                catch (error) {
                    res.status(404).json({
                        Message :'Unable to save transaction :',
                        error
                    })
                    console.log(error)
                }
            }
        }
    }
});





module.exports = router;