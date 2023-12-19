import { Module } from '@nestjs/common';
import { AuctionsModule } from './auctions/auctions.module'

@Module({
  imports: [
    AuctionsModule,
  ]
})
export class AppModule {}
