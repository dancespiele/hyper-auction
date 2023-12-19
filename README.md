## Hyper auctions

App that simulate an auctions using Hyperswarm RPC and Hypercores

## How to install

In the root directory of the project execute:

`npm install` or `yarn`

## How it works

In `hyper-auctions` we need to run who will create and close the auction (the auction host) with this command:

`yarn start:auction [your storage directory]` example: `yarn start:auction ./store-auction`

the auction host will publish an address once the command is executed, now we need to run the participants that will join to the auction with this command for each one:

`yarn join:auction [user storage directory] [address published by the host]` example: `yarn join:auction ./read-storage 844955f7d5820fd310a41b13dcbb0b7ea964bee5a85997c8c17a691a5bf21756`

**Note**: If the app is running in the same machine, storage directory must be different

### Comands for Auction host

Once that the auction host is running we can execute commands to handle the auction

`/open`: The host will open the auction, the app will ask which price we want to start selling the picture, the open
price will be notified to all the participants

`/close`: The host close the auction, the app will notify to all participants who is the winner. Winner is who made the highest bid

### Commands for participants

Also for the participants we can execute this command:

`/bid`: The participants set the bid, app will ask the price of the bid, all participants and host will be notified about the bid created

**Note**: if bid lower than the current highest bid, it will be ignored and notified to all the participants, if bid is set before host opens the auction it will be also ignored and notified

## Minor issue

The app works fine but there is a small issue that I didn't have time to resolve, when host or participant wants to exectute again a command, in this case needs to enter a line before it otherwise the input after app question will have the command answer instead of the value of the participant input and it will be ignored

## About the project

I used nestjs because help to create a good structure of the project (of course everything is in javascript), also when I was learning about Hyperpunch I created the module [nest-hyperpunch](https://www.npmjs.com/package/nest-hyperpunch) in order to have all the packages in one and I used in this project.
The core of the app is possible to find in `src/auctions/auctions.service`  

## Missing in this task

I didn't have time to create unit tests for all those methods `_ask`, `_getBid` and `_getMessage` neither I didn't have time to crearte end to end tests that simulate the auctions flow

