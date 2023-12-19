import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common'
import { AuctionsService } from './auctions/auctions.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'log', 'warn', 'debug'],
  });

  const auctionsService = app.get(AuctionsService);

  if (process.argv[2] === 'start-auction') {
    auctionsService.startAuction();
  }

  if (process.argv[2] === 'join-auction') {
    auctionsService.joinAuction();
  }
}
bootstrap();
