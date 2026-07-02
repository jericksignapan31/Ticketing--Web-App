import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCommentDto {
  @ApiProperty({
    example: 'We can substitute with the ASUS TUF keyboard which has same specs',
    description: 'Comment message for requisition discussion thread',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'message must be at least 5 characters' })
  message: string;
}
