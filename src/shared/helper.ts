import * as bcrypt from 'bcrypt';

export async function hash(input): Promise<string> {
  return bcrypt.hash(input, 12);
}
