import { Module } from '@nestjs/common';
import { CorestoreModule, HyperswarmModule } from 'nest-hyperpunch'
import { AuctionsService } from './auctions.service'

@Module({
  imports: [HyperswarmModule, CorestoreModule.forRoot(process.argv[3])],
  providers: [AuctionsService],
  exports: [AuctionsService]
})
export class AuctionsModule {}
