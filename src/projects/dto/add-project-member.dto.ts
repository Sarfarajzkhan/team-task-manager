import {
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}