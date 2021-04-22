import * as bcrypt from 'bcrypt';

export async function hash(input): Promise<string> {
  return bcrypt.hash(input, 12);
}

export async function validateHashedPassword(rawPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(rawPassword, hashedPassword);
}