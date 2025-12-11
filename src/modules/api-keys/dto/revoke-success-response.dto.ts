import { ApiProperty } from '@nestjs/swagger';

export class RevokeSuccessResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'API key revoked successfully',
  })
  message: string;

  @ApiProperty({
    description: 'ID of the revoked key',
    example: 'uuid-here',
  })
  key_id: string;
}
