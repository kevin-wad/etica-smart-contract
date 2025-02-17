
//var ContractInterface = require("../contracts/DeployedContractInfo")


const Tx = require('ethereumjs-tx')


var busySendingSolution = false;
var queuedMiningSolutions = [];


var lastSubmittedMiningSolutionChallengeNumber;

module.exports =  {


  init(web3,tokenContract,account,accounts)
  {
    this.web3=web3;
    this.tokenContract = tokenContract;
    this.account=account;
    this.accounts = accounts;

    busySendingSolution = false;

    setInterval(function(){ this.sendMiningSolutions()}.bind(this), 500)

  },



    async checkMiningSolution(addressFrom,solution_number,challenge_digest,challenge_number,target,callback){

      this.tokenContract.methods.checkMintSolution(solution_number,challenge_digest, challenge_number, target).call(callback)

    },


  async sendMiningSolutions()
    {


    //  console.log( 'sendMiningSolutions' )
      if(busySendingSolution == false)
      {
        if(queuedMiningSolutions.length > 0)
        {
          //console.log('publishing EticaToken stats before EticaToken.mint() has been called');
          //this.publishtokenstats('before');
          busySendingSolution = true;
          var nextSolution = queuedMiningSolutions.pop();

          if( nextSolution.challenge_number != lastSubmittedMiningSolutionChallengeNumber)
          {
            lastSubmittedMiningSolutionChallengeNumber =  nextSolution.challenge_number;
            //console.log('popping mining solution off stack ')

            try{
            var response = await this.submitMiningSolution(nextSolution.addressFrom,
              nextSolution.solution_number, nextSolution.challenge_digest);
            }catch(e)
            {
              console.log(e);
            }
          }


          console.log('response (transaction hash) of network-interface-helper.submitMiningSolution() from network-interface-helper.sendMiningSolutions() is:',response)
          // publish accounts balances:
          //console.log('publishing EticaToken stats after EticaToken.mint() has been called');
          // this.publishtokenstats('after');
          busySendingSolution = false;
        }
      }



    },



  queueMiningSolution(addressFrom,solution_number,challenge_digest, challenge_number)
  {

    console.log('pushed solution to stack')
    queuedMiningSolutions.push({
      addressFrom: addressFrom,
      solution_number: solution_number,
      challenge_digest: challenge_digest,
      challenge_number: challenge_number
    });

  },

  async submitMiningSolution(addressFrom,solution_number,challenge_digest){

    //  var addressFrom = this.vault.getAccount().public_address ;


    //console.log( 'submitMiningSolution' )
    //console.log( 'solution_number',solution_number )
    //console.log( 'challenge_digest',challenge_digest )



  try{
    var txCount = await this.web3.eth.getTransactionCount(addressFrom);
    //console.log('txCount',txCount)
   } catch(error) {  //here goes if someAsyncPromise() rejected}
    console.log(error);
     return error;    //this will result in a resolved promise.
   }

   //var mintMethod = this.tokenContract.mint(solution_number,challenge_digest);

//   var mintData = this.tokenContract.mint.getData(solution_number, challenge_digest);

   var addressTo = this.tokenContract.address;



    var txData = this.web3.eth.abi.encodeFunctionCall({
            name: 'mint',
            type: 'function',
            inputs: [{
                type: 'uint256',
                name: 'nonce'
            },{
                type: 'bytes32',
                name: 'challenge_digest'
            }]
        }, [solution_number, challenge_digest]);

    //    txData = mintData;

//    var estimatedGasCost = await mintMethod.estimateGas({from:addressFrom, to: addressTo });

  //  console.log('estimatedGasCost',estimatedGasCost);
    //console.log('txData',txData);

    //console.log('addressFrom',addressFrom);
    //console.log('addressTo',addressTo);


    const txOptions = {
      nonce: web3.utils.toHex(txCount),
      gas: web3.utils.toHex(1704624),
      gasPrice: web3.utils.toHex(2e9), // 2 Gwei
      to: addressTo,
      from: addressFrom,
      data: txData
    }

    // fire away!

  return new Promise(function (result,error) {

       this.sendSignedRawTransaction(this.web3,txOptions,addressFrom,this.account, function(err, res) {
        if (err) error(err)
         console.log('response (transaction hash) of EticaToken.mint() is :', res)
          result(res)
      })

    }.bind(this));


  },


  async submitSignedTx(web3,addressFrom,account){


    const addressTo = this.tokenContract.address;

      //console.log('addressFrom',addressFrom)
        //console.log('addressTo',addressTo)

      try{
        var txCount = await web3.eth.getTransactionCount(addressFrom);
        //console.log('txCount',txCount)
       } catch(error) {  //here goes if someAsyncPromise() rejected}
        console.log(error);
         return error;    //this will result in a resolved promise.
       }


    const txOptions = {
      nonce: web3.utils.toHex(txCount),
      gasLimit: web3.utils.toHex(25000),
      gasPrice: web3.utils.toHex(2e9), // 2 Gwei
      to: addressTo,
      from: addressFrom,
      value: web3.utils.toHex(web3.utils.toWei('123', 'wei'))
    //  value: web3.utils.toHex(web3.utils.toWei('123', 'wei'))
    }

    // fire away!

    //console.log('fire away ')
    await this.sendSignedRawTransaction(web3,txOptions,addressFrom,account, function(err, result) {
      if (err) return console.log('error', err)
      //console.log('sent', result)
    })



  },

  async sendSignedRawTransaction(web3,txOptions,addressFrom,account,callback) {


    var fullPrivKey = account.privateKey;

    var privKey = this.truncate0xFromString( fullPrivKey )

  //  'a6c4ca8fdbb9bf6c4424832fe970c034282a3a8ae31339b7b5c64478dbebf366'

    const privateKey = new Buffer( privKey, 'hex')
    const transaction = new Tx(txOptions)


    transaction.sign(privateKey)


    const serializedTx = transaction.serialize().toString('hex')


      var result =  web3.eth.sendSignedTransaction('0x' + serializedTx, callback)

  },


   truncate0xFromString(s)
  {
    if(s.startsWith('0x')){
      return s.substring(2);
    }
    return s;
  },


// status: before or after EticaToken.mint() call
/*  publishtokenstats(status){

        for (i = 9; i < 10; i++) {
          return tokenContract.balanceOf(this.accounts[i]).then(function(receipt){
          // supply must equal initial supply
          console.log('------- > account', i, ': ETI balance', status, 'EticaToken.mint() has been called is:', web3.utils.fromWei(receipt, "ether" ), 'ETI  <-------- ')
        })
        }
  }, */






}
