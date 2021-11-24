const express = require('express');
const router = express.Router();

const TronWeb = require('tronweb');

const HttpProvider = TronWeb.providers.HttpProvider;

const fullNode = new HttpProvider(process.env.HOST)

const solidityNode = new HttpProvider(process.env.HOST)

const eventServer = process.env.HOST;

const privateKey = process.env.privateKey;

const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

router.post('/balance', async(req, res, next) => {
    
    const {address} = req.body;
    try {
        const balance = await tronWeb.trx.getBalance(address);
        console.log(balance);
        res.status(200).json({balance})
    } catch (error) {
        console.error(error);
        res.status(404).json({
            message : 'Account not found!',
            address
        })
    }
});


module.exports = router;