import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const hashPassword = async (plain) => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const comparePassword = async (plain, hash) => {
  return bcrypt.compare(plain, hash);
};
