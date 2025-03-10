import { Module } from '@nestjs/common';
import { FieldTypeService } from './field-type.service';
import { FieldTypeController } from './field-type.controller';

@Module({
  controllers: [FieldTypeController],
  providers: [FieldTypeService],
})
export class FieldTypeModule {}
