
const StellarSdk = require('stellar-sdk')
const regeneratorRuntime = require("regenerator-runtime");

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const SUPPLIE_ACCOUNT = 'GAPUR4W7JCYIKX2TSYBWLGW3JMCPMPM4WIZFVQ4ERD7PGSLMDSPX66PY'
const SUPPLIE_ACCOUNT_SECRET = 'SC467F4HMZTVUPUIBZZDVRF3ZEYMMDBQOHGGB46JTWVFD2PVSVWD767P'
const SUPPLIE_AMOUNT = 50

"use strict";

function _asyncToGenerator(fn) {
  return function() {
    var gen = fn.apply(this, arguments);
    return new Promise(function(resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(
            function(value) {
              step("next", value);
            },
            function(err) {
              step("throw", err);
            }
          );
        }
      }
      return step("next");
    });
  };
}

exports.transfer = (function() {
  var _ref = _asyncToGenerator(
    /*#__PURE__*/ regeneratorRuntime.mark(function _callee(to) {
      var amount,
        sourceKeypair,
        sourcePublicKey,
        options,
        account,
        transaction,
        transactionResult,
        hash;
      return regeneratorRuntime.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return parseFloat(SUPPLIE_AMOUNT).toFixed(7);

              case 3:
                amount = _context.sent;
                _context.next = 6;
                return amount.toString();

              case 6:
                amount = _context.sent;
                _context.next = 9;
                return StellarSdk.Network.useTestNetwork();

              case 9:
                sourceKeypair = StellarSdk.Keypair.fromSecret(
                  SUPPLIE_ACCOUNT_SECRET
                );
                sourcePublicKey = sourceKeypair.publicKey();
                options = {
                  destination: to,
                  asset: StellarSdk.Asset.native(),
                  amount: amount
                };
                _context.next = 14;
                return server.loadAccount(sourcePublicKey);

              case 14:
                account = _context.sent;
                _context.next = 17;
                return new StellarSdk.TransactionBuilder(account)
                  .addOperation(StellarSdk.Operation.payment(options))
                  .build();

              case 17:
                transaction = _context.sent;
                _context.next = 20;
                return transaction.sign(sourceKeypair);

              case 20:
                _context.next = 22;
                return server.submitTransaction(transaction);

              case 22:
                transactionResult = _context.sent;
                hash = transactionResult.hash;

                console.log(hash, "hash.....");
                return _context.abrupt("return", hash);

              case 28:
                _context.prev = 28;
                _context.t0 = _context["catch"](0);

                console.log(_context.t0.data, "error transfer");
                throw _context.t0;

              case 32:
              case "end":
                return _context.stop();
            }
          }
        },
        _callee,
        undefined,
        [[0, 28]]
      );
    })
  );

  return function(_x) {
    return _ref.apply(this, arguments);
  };
})();
