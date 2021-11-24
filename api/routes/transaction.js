const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const nodemailer = require('nodemailer')

const TronWeb = require('tronweb');

const HttpProvider = TronWeb.providers.HttpProvider;

const fullNode = new HttpProvider(process.env.HOST)

const solidityNode = new HttpProvider(process.env.HOST)

const eventServer = process.env.HOST;

const privateKey = process.env.privateKey;

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

router.post('/transaction', async(req, res, next) => {

    try {
        const { email, from, to, amount, name } = req.body;
        if (!(email && from && to && amount)){
            res.status(400).send('All input field is requried!');
        }else{
            const em = email.match( /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)
            if(!(em)){
                res.send('Invalid Email') 
            }else{
                const tradeobj = await tronWeb.transactionBuilder.sendTrx(to, amount, from);
                const signedtxn = await tronWeb.trx.sign(tradeobj);
                const receipt = await tronWeb.trx.sendRawTransaction(signedtxn);

                const transaction = new Transaction({
                    _id : new mongoose.Types.ObjectId,
                    email : email,
                    from : req.body.from,
                    to : req.body.to,
                    amount : req.body.amount,
                    txID: receipt.txid
                });

                const mail = nodemailer.createTransport({
                    service: 'gmail',
                    auth:{
                        user:process.env.USER,
                        pass:process.env.PASSWORD    
                    }
                });
                
                const mailOptions = {
                    from: process.env.USER,
                    to: email,
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
                                                    <td>: &nbsp; ${from}</td>
                                                </tr>
                                                <tr>
                                                    <td>Receiver Address </td>
                                                    <td>: &nbsp; ${to}</td>
                                                </tr>
                                                <tr>
                                                    <td>Amount </td>
                                                    <td>: &nbsp; ${amount}</td>
                                                </tr> 
                                                <tr>
                                                    <td>Tnx.Hash </td>
                                                    <td>: &nbsp; https://shasta.tronscan.org/#/transaction/${transaction.txID}</td>
                                                </tr> 
                                            </table>
                                       </div>
                                       <div class="wrapper">
                                           <p>Hi ${req.body.name}</p>
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
                    }
                });

                try {
                    const t1 = transaction.save()
                    res.status(200).json({
                        Message : 'Transaction save and Email sent successfully!',
                        transaction
                    }) 
                } catch (error) {
                    res.status(404).json({
                        Message :'Unable to save transaction :',
                        error
                    })
                }
                }
        }
    } catch (error) {
        console.error(error);
        res.status(404).json({
            message : 'Transaction failed!',
            address
        })
    } 
});

module.exports = router;

{/* <h3>Your Transaction details is :</h3>
                            <p><b>ID :</b> ${transaction._id}</p>
                            <p><b>Email :</b> ${email}</p>
                            <p><b>Sender Address :</b> ${from}</p>
                            <p><b>Receiver Address :</b> ${to}</p>
                            <p><b>Amount :</b> ${amount}</p>
                            <p><b>TxHash :</b> https://shasta.tronscan.org/#/transaction/${transaction.txID}</p> */}