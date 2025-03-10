import { Test, TestingModule } from '@nestjs/testing';
import { FieldTypeController } from './field-type.controller';
import { FieldTypeService } from './field-type.service';

describe('FieldTypeController', () => {
  let controller: FieldTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldTypeController],
      providers: [FieldTypeService],
    }).compile();

    controller = module.get<FieldTypeController>(FieldTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
