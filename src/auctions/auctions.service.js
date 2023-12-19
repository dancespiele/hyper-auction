import { Injectable, Dependencies, Logger } from '@nestjs/common';
import { Hyperswarm, goodbye, crypto, Corestore, Hyperbee } from 'nest-hyperpunch'
import readline from 'readline';
import b4a from 'b4a';
import fs from 'fs';


@Injectable()
@Dependencies(Hyperswarm, Corestore)
export class AuctionsService {
  constructor(hyperswarm, corestore) {
    this.swarm = hyperswarm;
    this.store = corestore;

    this.commands = ['/open\n', '/close\n', '/bid\n']
    this.conns = []
  }

  async startAuction() {
    goodbye(() => this.swarm.destroy());

    const core = this.store.get({ name: 'auction' });

    const db = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8'
    })

    await core.ready();

    const discovery = this.swarm.join(core.discoveryKey);

    discovery.flushed().then(() => {
      Logger.log(`bee key: ${b4a.toString(core.key, 'hex')}`);
    });

    this.swarm.on('connection', (conn) => {
      this.conns.push(conn);
      const peer = b4a.toString(conn.remotePublicKey, 'hex');
      Logger.log(`${peer} connected to auction!`);
      conn.on('data', (data) => {
        this._getBid(data, db, peer)
      });

      conn.once('close', () => Logger.log(`${peer} disconnect to auction!`));
      this.store.replicate(conn);
    });

    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', async d => {
      let notify;

      if (d.toString() === this.commands[0]) {
        const dataDb = await db.get('bid');

        if(dataDb?.value) {
          notify = { 
            message: `You currently has an open auction.`
          }
        } else {
          const bidPrice = await this._ask('What is the open price of the picture? ');

          notify = { 
            message: `Open price ${bidPrice} USDT.`
          }

          await db.put('bid', JSON.stringify([{
            user: b4a.toString(core.key, 'hex'),
            price: bidPrice
          }]));
        }
      }

      if(d.toString() === this.commands[1]) {
        const dataDb = await db.get('bid');

        if(!dataDb?.value) {
          notify = { 
            message: `Not bid.`
          }
        }else {
          const bids = JSON.parse(dataDb.value);

          const hightestBid = bids.sort((a, b) => b.price - a.price)[0];

          notify = { 
            message: `Sold the picture for ${hightestBid.price} USDT to ${hightestBid.user}. Congratulations!`
          }

          await db.del('bid');
        }
      }

      if (notify) {
        for(const conn of this.conns) {
          conn.write(JSON.stringify(notify));
        }
      }
    })

  }

  async joinAuction() {
    const key = b4a.from(process.argv[4], 'hex');

    goodbye(() => this.swarm.destroy());

    this.swarm.on('connection', (conn) => {
      this.conns.push(conn);
      const peer = b4a.toString(conn.remotePublicKey, 'hex')
      Logger.log(`Wellcome to the auctions!`);
      conn.on('data', (data) => this._getMessage(data, peer));
      conn.once('close', () => Logger.log(`${peer}: disconnected`));
      this.store.replicate(conn);
    });

    const core = this.store.get({ key });

    await core.ready()

    const foundPeers = this.store.findingPeers();

    this.swarm.join(core.discoveryKey);
    this.swarm.flush().then(() => foundPeers());

    await core.update();

    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', async d => {
      let notify;

      if (d.toString() === this.commands[2]) {
        const bidPrice = await this._ask('What is the price of your bid? ');

        notify = { 
          message: `Bid created for ${bidPrice} USDT.`,
          price: bidPrice
        }
      }

      if (notify) {
        for(const conn of this.conns) {
          conn.write(JSON.stringify(notify));
        }
      }
    })
  }

  async _getBid(data, db, peer) {
    if(data.toString().includes('hypercore/alpha')) {
      return;
    }

    if(!data.toString().includes('"price":')) {
      Logger.log(`${peer}: ${data}`);

      return;
    }

    const dataObj = JSON.parse(data);
    const dataDb = await db.get('bid');

    Logger.log(`${peer}: ${JSON.parse(data).message}`);

    if(!dataDb?.value) {
      for (const conn of this.conns) {
        conn.write(JSON.stringify({
          message: `Bid from ${peer} will be ignored because not open price`
        }));
      }

      return
    }

    const bids = JSON.parse(dataDb.value);

    if(bids?.some(b => parseInt(b.price) >= parseInt(dataObj.price))) {
      for (const conn of this.conns) {
        conn.write(JSON.stringify({
          message:`Bid from ${peer} will be ignored because price lower or equal than current bid`
        }));
      }

      return
    }

    await db.put('bid', JSON.stringify([...bids, {
      user: peer,
      price: dataObj.price
    }]));
  }

  _getMessage(data, peer) {
    if(data.toString().includes('"message":')) {
      Logger.log(`${peer}: ${JSON.parse(data).message}`)
      return;
    }
  }

  _ask(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  
    return new Promise(resolve => {
      rl.question(question, answer => {
        resolve(answer);
        rl.close();
        process.stdin.resume();
      });
    });
  }
}