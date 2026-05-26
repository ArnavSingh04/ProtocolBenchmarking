import { Accounts } from 'meteor/accounts-base';

// Configure accounts if needed
if (Meteor.isServer) {
  Accounts.config({
    forbidClientAccountCreation: false
  });
}

