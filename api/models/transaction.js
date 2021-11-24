const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    _id : mongoose.Types.ObjectId,
    email:{
        type : String,
        require : true
    },
    from:{
        type : String,
        require : true
    },
    to:{
        type : String,
        require : true
    },
    amount:{
        type : String,
        require : true
    },
    txID:{
        type : String,
        require : true
    },
    status : {
        type : Boolean,
        default : false
    }},
    {
        timestamps:true
    },
);

module.exports = mongoose.model('Transaction', transactionSchema)