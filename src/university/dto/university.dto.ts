import { ApiProperty } from '@nestjs/swagger';

export class UniversityDto {
  @ApiProperty({
    description: 'Name of the university',
    example: 'Harvard University',
  })
  name: string;

  @ApiProperty({
    description: 'Country where the university is located',
    example: 'United States',
  })
  country: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
  })
  alphaTwoCode: string;

  @ApiProperty({
    description: 'List of domains associated with the university',
    example: ['harvard.edu'],
    type: [String],
  })
  domains: string[];

  @ApiProperty({
    description: 'List of web pages associated with the university',
    example: ['https://www.harvard.edu'],
    type: [String],
  })
  webPages: string[];

  @ApiProperty({
    description: 'State or province where the university is located',
    example: 'Massachusetts',
    nullable: true,
  })
  stateProvince: string | null;
}
